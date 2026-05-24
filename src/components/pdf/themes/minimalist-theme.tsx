import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground } from '../styles';
import { PdfDaywiseIndex } from '../pages';

export const MinimalistTheme = ({ itinerary, title, agent, finalTotal = 0, showTimestamps = true, showPrices = true, daySummaries }: ThemeProps) => {
    const accent = agent.primaryColor || "#000000";
    const totalActivities = itinerary.itinerary.reduce((s, d) => s + d.timeline.length, 0);
    
    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", backgroundColor: "#f8fafc", backgroundImage: `url("${getThematicBackground(itinerary, 'minimalist', accent)}")`, backgroundRepeat: "repeat", color: "#0f172a", width: "100%" }}>

            {/* Cover Section */}
            <div data-pdf-section="cover" style={{ paddingBottom: "10px" }}>
                <div style={{ height: "240px", overflow: "hidden", position: "relative" }}>
                    <img
                        src={getCoverImage(itinerary)}
                        alt=""
                        style={{ width: "100%", height: "240px", objectFit: "cover", display: "block", filter: "brightness(0.7)" }}
                        crossOrigin="anonymous"
                    />
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, rgba(0,0,0,0.6), transparent)` }} />
                    <div style={{ position: "absolute", bottom: "35px", left: "45px", right: "45px", color: "#fff" }}>
                        <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "5px", margin: "0 0 12px 0", opacity: 0.85, fontWeight: 700 }}>{agent.companyName}</p>
                        <h1 style={{ fontSize: "40px", fontWeight: 900, margin: 0, lineHeight: "1.1", textTransform: "uppercase", letterSpacing: "-1px", fontFamily: "'Outfit', sans-serif" }}>{title}</h1>
                    </div>
                </div>

                {/* Thin Accent bar */}
                <div style={{ height: "3px", background: accent }} />

                {/* Main cover body */}
                <div style={{ padding: "45px", background: "rgba(255,255,255,0.42)" }}>
                    <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 35px 0", lineHeight: "1.7", fontWeight: 500 }}>
                        {itinerary.itinerary?.length || 0}-day bespoke journey · Curated exclusively by {agent.agentName}
                    </p>

                    {/* Stat cards row */}
                    <div style={{ display: "flex", gap: "20px", marginBottom: "40px", pageBreakInside: "avoid" }}>
                        {[
                            { label: "Duration", value: `${itinerary.itinerary.length} Days` },
                            { label: "Est. Budget", value: formatCurrency(finalTotal || getTotalBudget(itinerary), (itinerary as any).pricing?.currency || DEFAULT_CURRENCY) },
                            { label: "Activities", value: `${totalActivities}+ Items` },
                        ].map((stat, i) => (
                            <div key={i} style={{ flex: 1, padding: "20px", border: "1px solid rgba(148,163,184,0.24)", borderTop: `3px solid ${accent}`, background: "rgba(255,255,255,0.62)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
                                <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "2.5px", color: "#64748b", margin: "0 0 6px 0", fontWeight: 800 }}>{stat.label}</p>
                                <p style={{ fontSize: "20px", fontWeight: 900, margin: 0, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Agent details row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "30px", borderTop: "1px solid #f1f5f9", pageBreakInside: "avoid" }}>
                        {/* Bio */}
                        <div style={{ flex: 2, paddingRight: "40px" }}>
                            {agent.agentBio && (
                                <div style={{ borderLeft: `2.5px solid ${accent}`, paddingLeft: "20px" }}>
                                    <p style={{ fontSize: "13px", lineHeight: "1.8", color: "#475569", margin: 0, fontStyle: "italic" }}>{agent.agentBio}</p>
                                </div>
                            )}
                        </div>
                        {/* Contact */}
                        <div style={{ flex: 1, textAlign: "right", fontSize: "12px", color: "#64748b", lineHeight: "2", fontWeight: 500 }}>
                            <p style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px", margin: "0 0 6px 0" }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ margin: "1px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ margin: "1px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ margin: "4px 0 0 0", color: accent, fontWeight: 700, textDecoration: "underline" }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <PdfDaywiseIndex itinerary={itinerary} accentColor={accent} theme="minimalist" daySummaries={daySummaries} />

            {/* Daily itinerary */}
            <div style={{ padding: "0 45px 45px" }}>
                {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "35px", display: "block" }}>

                        {/* Day header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", pageBreakInside: "avoid", pageBreakAfter: "avoid", breakInside: "avoid" }}>
                            <img
                                src={getDayImage(day)}
                                alt={formatTitleCase(day.areaFocus)}
                                style={{ width: "80px", height: "80px", objectFit: "cover", flexShrink: 0, display: "block", borderRadius: "8px" }}
                                crossOrigin="anonymous"
                            />
                            <div style={{ flex: 1, padding: "10px 0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                                    <span style={{ fontSize: "36px", fontWeight: 300, color: accent, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{String(index + 1).padStart(2, '0')}</span>
                                    <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "1px", color: "#0f172a" }}>{formatTitleCase(day.areaFocus)}</h3>
                                </div>
                                <div style={{ display: "flex", gap: "16px", marginTop: "4px", fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                                    {day.date && <span>{formatDate(day.date)}</span>}
                                    {showPrices !== false && (day as any).dailyStats?.totalCost && (!(itinerary as any).pricing || (itinerary as any).pricing.costingType !== 'manual') && (
                                        <span style={{ color: accent }}>{formatCurrency((day as any).dailyStats?.totalCost, (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Activities */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                                <div key={si} className="pdf-no-cut" style={{ display: "flex", alignItems: "flex-start", gap: "24px", padding: "14px 20px", background: "rgba(255,255,255,0.58)", borderRadius: "8px", border: "1px solid rgba(148,163,184,0.18)", pageBreakInside: "avoid", boxShadow: "0 6px 20px rgba(15,23,42,0.03)" }}>
                                    {showTimestamps !== false ? (
                                        <div style={{ width: "70px", flexShrink: 0, fontSize: "12px", fontWeight: 800, color: accent, fontFamily: "'Outfit', sans-serif", lineHeight: "1.7" }}>{step.time}</div>
                                    ) : (
                                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: accent, marginTop: "7px", flexShrink: 0 }} />
                                    )}
                                    <p style={{ flex: 1, margin: 0, fontSize: "13.5px", lineHeight: "1.7", color: "#334155", fontWeight: 500 }}>{step.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div data-pdf-section="footer" style={{ padding: "20px 45px", borderTop: "1px solid rgba(148,163,184,0.2)", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 700, background: "rgba(255,255,255,0.42)" }}>
                <span>{agent.companyName}</span>
                <span>{new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};


