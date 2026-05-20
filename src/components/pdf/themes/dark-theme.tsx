import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
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

export const DarkTheme = ({ itinerary, title, agent, finalTotal = 0, showTimestamps = true, showPrices = true }: ThemeProps) => {
    const accent = agent.primaryColor || "#a855f7";
    const rgbAccent = hexToRgb(accent);
    const totalActivities = itinerary.itinerary?.reduce((sum, d) => sum + (d.timeline?.length || 0), 0) || 0;
    
    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", backgroundColor: "#070a13", color: "#e2e8f0", width: "100%" }}>

            {/* Cover Section */}
            <div data-pdf-section="cover" style={{ paddingBottom: "10px" }}>
                <div style={{ position: "relative", height: "300px", overflow: "hidden" }}>
                    <img
                        src={getCoverImage(itinerary)}
                        alt=""
                        style={{ width: "100%", height: "300px", objectFit: "cover", display: "block", filter: "brightness(0.35) saturate(0.7)" }}
                        crossOrigin="anonymous"
                    />
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, #070a13 40%, rgba(7,10,19,0.3))` }} />
                    <div style={{ position: "absolute", bottom: "40px", left: "45px", right: "45px", zIndex: 1 }}>
                        <p style={{ fontSize: "11px", letterSpacing: "5px", textTransform: "uppercase", color: accent, margin: "0 0 12px 0", fontWeight: 800 }}>{agent.companyName}</p>
                        <h1 style={{ fontSize: "40px", fontWeight: 900, margin: "0 0 8px 0", color: "#ffffff", lineHeight: "1.1", letterSpacing: "-1px", fontFamily: "'Outfit', sans-serif", textShadow: `0 0 20px rgba(${rgbAccent}, 0.3)` }}>{title}</h1>
                        <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, fontWeight: 500 }}>Bespoke Journey designed by {agent.agentName}</p>
                    </div>
                </div>

                {/* Accent bar with Neon glow */}
                <div style={{ height: "3px", background: `linear-gradient(to right, ${accent}, #ec4899, transparent)`, boxShadow: `0 0 8px ${accent}` }} />

                {/* Cover body */}
                <div style={{ padding: "45px" }}>

                    {/* Stat cards */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "35px", pageBreakInside: "avoid" }}>
                        {[
                            { label: "Duration", value: `${itinerary.itinerary?.length || 0} Days` },
                            { label: "Est. Budget", value: formatCurrency(finalTotal || getTotalBudget(itinerary), itinerary.pricing?.currency || DEFAULT_CURRENCY) },
                            { label: "Activities", value: `${totalActivities}+ Items` },
                        ].map((stat, i) => (
                            <div key={i} style={{ flex: 1, padding: "20px", border: "1px solid rgba(255,255,255,0.06)", borderTop: `3px solid ${accent}`, background: "rgba(255,255,255,0.02)", borderRadius: "8px", boxShadow: `0 4px 20px rgba(0,0,0,0.15)` }}>
                                <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "2.5px", color: "#64748b", margin: "0 0 6px 0", fontWeight: 800 }}>{stat.label}</p>
                                <p style={{ fontSize: "20px", fontWeight: 900, margin: 0, color: accent, fontFamily: "'Outfit', sans-serif" }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Agent details */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "25px", borderTop: "1px solid rgba(255,255,255,0.08)", pageBreakInside: "avoid" }}>
                        <div style={{ flex: 2, paddingRight: "40px" }}>
                            {agent.agentBio && (
                                <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "18px" }}>
                                    <p style={{ fontSize: "13px", lineHeight: "1.8", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>{agent.agentBio}</p>
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontSize: "12px", color: "#64748b", lineHeight: "2", fontWeight: 500 }}>
                            <p style={{ fontWeight: 800, color: "#ffffff", fontSize: "14px", margin: "0 0 6px 0" }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ margin: "1px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ margin: "1px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ margin: "4px 0 0 0", color: accent, fontWeight: 700, textDecoration: "underline" }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily itinerary */}
            <div style={{ padding: "0 45px 45px" }}>
                {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "35px", display: "block" }}>

                        {/* Day header: thumbnail + info panel */}
                        <div style={{ display: "flex", alignItems: "stretch", marginBottom: "14px", borderRadius: "10px", overflow: "hidden", pageBreakInside: "avoid", pageBreakAfter: "avoid", breakInside: "avoid", border: "1px solid rgba(255,255,255,0.06)", boxShadow: `0 4px 15px rgba(0,0,0,0.1)` }}>
                            <img
                                src={getDayImage(day)}
                                alt={formatTitleCase(day.areaFocus)}
                                style={{ width: "100px", height: "90px", objectFit: "cover", flexShrink: 0, display: "block", filter: "brightness(0.5) saturate(0.8)" }}
                                crossOrigin="anonymous"
                            />
                            <div style={{ flex: 1, padding: "12px 20px", borderLeft: `3px solid ${accent}`, background: "rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                                    <span style={{ fontSize: "30px", fontWeight: 900, color: accent, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{String(index + 1).padStart(2, '0')}</span>
                                    <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "1px", color: "#ffffff" }}>{formatTitleCase(day.areaFocus)}</h3>
                                </div>
                                <div style={{ display: "flex", gap: "16px", marginTop: "4px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>
                                    {day.date && <span>{formatDate(day.date)}</span>}
                                    {showPrices !== false && day.dailyStats?.totalCost && (!itinerary.pricing || itinerary.pricing.costingType !== 'manual') && (
                                        <span style={{ color: accent }}>{formatCurrency(day.dailyStats?.totalCost, itinerary.pricing?.currency || DEFAULT_CURRENCY)}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Activities */}
                        <div style={{ padding: "20px 24px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                                <div key={si} className="pdf-no-cut" style={{ display: "flex", alignItems: "flex-start", gap: "20px", padding: "12px 16px", borderLeft: `2.5px solid rgba(${rgbAccent}, 0.35)`, borderRadius: "0 8px 8px 0", background: "rgba(255,255,255,0.025)", pageBreakInside: "avoid" }}>
                                    {showTimestamps !== false ? (
                                        <span style={{ fontSize: "12px", fontWeight: 800, color: accent, width: "70px", flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>{step.time}</span>
                                    ) : (
                                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: accent, marginTop: "6px", flexShrink: 0 }} />
                                    )}
                                    <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.75", color: "#cbd5e1", flex: 1, fontWeight: 500 }}>{step.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div data-pdf-section="footer" style={{ padding: "24px 45px", borderTop: `1px solid rgba(255,255,255,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                <p style={{ margin: 0, fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 800 }}>Premium Curated Edition</p>
                <p style={{ margin: 0, fontSize: "13px", color: accent, fontWeight: 800, letterSpacing: "1px", fontFamily: "'Outfit', sans-serif" }}>{agent.companyName}</p>
            </div>
        </div>
    );
};


