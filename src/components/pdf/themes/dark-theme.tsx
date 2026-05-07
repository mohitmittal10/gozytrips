import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol } from '@/lib/itinerary-calculator';
import { formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';

export const DarkTheme = ({ itinerary, title, agent }: ThemeProps) => {
    const accent = agent.primaryColor || "#a855f7";
    const totalActivities = itinerary.itinerary?.reduce((sum, d) => sum + (d.timeline?.length || 0), 0) || 0;
    return (
        /* No repeating dot background — clean pure dark */
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#0a0e1a", color: "#e2e8f0", width: "100%" }}>

            {/* ── Cover image ── */}
            <div data-pdf-section="cover">
                <div style={{ position: "relative", height: "260px", overflow: "hidden" }}>
                    <img
                        src={getCoverImage(itinerary)}
                        alt=""
                        style={{ width: "100%", height: "260px", objectFit: "cover", display: "block", filter: "brightness(0.35) saturate(0.5)" }}
                        crossOrigin="anonymous"
                    />
                    {/* gradient: dark left panel for text */}
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, rgba(10,14,26,0.92) 38%, rgba(10,14,26,0.2))` }} />
                    <div style={{ position: "absolute", bottom: "35px", left: "48px", zIndex: 1 }}>
                        <p style={{ fontSize: "11px", letterSpacing: "5px", textTransform: "uppercase", color: accent, margin: "0 0 12px 0" }}>{agent.companyName}</p>
                        <h1 style={{ fontSize: "38px", fontWeight: 900, margin: "0 0 6px 0", color: "#f1f5f9", lineHeight: "1.1", letterSpacing: "-0.5px" }}>{title}</h1>
                        <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Curated by {agent.agentName}</p>
                    </div>
                </div>

                {/* ── Accent bar ── */}
                <div style={{ height: "3px", background: `linear-gradient(to right, ${accent}, transparent)` }} />

                {/* ── Cover body ── */}
                <div style={{ padding: "36px 48px" }}>

                    {/* Stat cards */}
                    <div style={{ display: "flex", gap: "14px", marginBottom: "32px", pageBreakInside: "avoid" }}>
                        {[
                            { label: "Duration", value: `${itinerary.itinerary?.length || 0} Days` },
                            { label: "Est. Budget", value: `${getCurrencySymbol(itinerary.pricing?.currency || DEFAULT_CURRENCY)}${getTotalBudget(itinerary).toLocaleString()}` },
                            { label: "Activities", value: `${totalActivities}+` },
                        ].map((stat, i) => (
                            <div key={i} style={{ flex: 1, padding: "18px 20px", borderTop: `3px solid ${accent}`, background: "rgba(255,255,255,0.04)", borderRadius: "0 0 8px 8px" }}>
                                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#64748b", margin: "0 0 6px 0" }}>{stat.label}</p>
                                <p style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: accent }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Agent details: bio left, contact right */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", pageBreakInside: "avoid" }}>
                        <div style={{ flex: 2, paddingRight: "40px" }}>
                            {agent.agentBio && (
                                <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "16px" }}>
                                    <p style={{ fontSize: "13px", lineHeight: "1.8", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>{agent.agentBio}</p>
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontSize: "12px", color: "#64748b", lineHeight: "2" }}>
                            <p style={{ fontWeight: 800, color: "#e2e8f0", fontSize: "14px", margin: "0 0 4px 0" }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ margin: "2px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ margin: "2px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ margin: "2px 0", color: accent, fontWeight: 600 }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Daily itinerary ── */}
            <div style={{ padding: "0 48px 48px" }}>
                {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "20px", display: "block" }}>

                        {/* Day header: thumbnail + info panel side-by-side */}
                        <div style={{ display: "flex", alignItems: "stretch", marginBottom: "12px", pageBreakInside: "avoid", pageBreakAfter: "avoid", breakInside: "avoid" }}>
                            <img
                                src={getDayImage(day)}
                                alt={formatTitleCase(day.areaFocus)}
                                style={{ width: "90px", height: "90px", objectFit: "cover", flexShrink: 0, display: "block", filter: "brightness(0.6) saturate(0.7)" }}
                                crossOrigin="anonymous"
                            />
                            <div style={{ flex: 1, padding: "12px 18px", borderTop: `3px solid ${accent}`, background: "rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                                    <span style={{ fontSize: "26px", fontWeight: 900, color: accent, lineHeight: 1 }}>{String(index + 1).padStart(2, '0')}</span>
                                    <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", color: "#f1f5f9" }}>{formatTitleCase(day.areaFocus)}</h3>
                                </div>
                                <div style={{ display: "flex", gap: "14px", marginTop: "5px", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                                    {day.date && <span>{formatDate(day.date)}</span>}
                                    {(day.dailyStats as any)?.walkingDistance && <span>{formatDistance((day.dailyStats as any).walkingDistance)} km walk</span>}
                                    {day.dailyStats?.totalCost && <span style={{ color: accent }}>{getCurrencySymbol(itinerary.pricing?.currency || DEFAULT_CURRENCY)}{formatCurrency(day.dailyStats?.totalCost, itinerary.pricing?.currency || DEFAULT_CURRENCY)}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Activities */}
                        <div style={{ padding: "16px 20px", borderRadius: "0 0 10px 10px", background: "rgba(15, 23, 42, 0.5)" }}>
                            {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                                <div key={si} className="pdf-no-cut" style={{ display: "flex", gap: "14px", marginBottom: si === day.timeline.length - 1 ? "0" : "10px", padding: "10px 14px", borderLeft: `3px solid ${accent}50`, borderRadius: "0 6px 6px 0", background: "rgba(255,255,255,0.03)", pageBreakInside: "avoid" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: accent, width: "68px", flexShrink: 0 }}>{step.time}</span>
                                    <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6", color: "#cbd5e1" }}>{step.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Footer ── */}
            <div data-pdf-section="footer" style={{ padding: "18px 48px", borderTop: `3px solid ${accent}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#334155", textTransform: "uppercase", letterSpacing: "2px" }}>Powered by GozyTrips</p>
                <p style={{ margin: 0, fontSize: "13px", color: accent, fontWeight: 700, letterSpacing: "1px" }}>{agent.companyName}</p>
            </div>
        </div>
    );
};
