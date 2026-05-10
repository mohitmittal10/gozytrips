import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';

export const MinimalistTheme = ({ itinerary, title, agent, finalTotal = 0 }: ThemeProps) => {
    const accent = agent.primaryColor || "#000000";
    const totalActivities = itinerary.itinerary.reduce((s, d) => s + d.timeline.length, 0);
    return (
        /* No backgroundImage — keep it truly minimal and clean */
        <div style={{ fontFamily: "'Helvetica Neue', 'Arial', sans-serif", backgroundColor: "#ffffff", color: "#111", width: "100%" }}>

            {/* ── Cover strip image ── */}
            <div data-pdf-section="cover">
                <div style={{ height: "220px", overflow: "hidden", position: "relative" }}>
                    <img
                        src={getCoverImage(itinerary)}
                        alt=""
                        style={{ width: "100%", height: "220px", objectFit: "cover", display: "block", filter: "brightness(0.75)" }}
                        crossOrigin="anonymous"
                    />
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${accent}cc, transparent)` }} />
                    <div style={{ position: "absolute", bottom: "30px", left: "50px", color: "#fff" }}>
                        <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "5px", margin: "0 0 10px 0", opacity: 0.85 }}>{agent.companyName}</p>
                        <h1 style={{ fontSize: "42px", fontWeight: 900, margin: 0, lineHeight: "1.08", textTransform: "uppercase", letterSpacing: "-1px", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{title}</h1>
                    </div>
                </div>

                {/* ── Accent bar ── */}
                <div style={{ height: "4px", background: accent }} />

                {/* ── Main cover body ── */}
                <div style={{ padding: "40px 50px" }}>

                    {/* Headline summary */}
                    <p style={{ fontSize: "14px", color: "#666", margin: "0 0 30px 0", lineHeight: "1.6" }}>
                        {itinerary.itinerary?.length || 0}-day journey · Curated by {agent.agentName}
                    </p>

                    {/* Stat cards row */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "35px", pageBreakInside: "avoid" }}>
                        {[
                            { label: "Duration", value: `${itinerary.itinerary.length} Days` },
                            { label: "Est. Budget", value: formatCurrency(finalTotal || getTotalBudget(itinerary), itinerary.pricing?.currency || DEFAULT_CURRENCY) },
                            { label: "Activities", value: `${totalActivities}+` },
                        ].map((stat, i) => (
                            <div key={i} style={{ flex: 1, padding: "18px 20px", borderTop: `3px solid ${accent}`, background: "#f8f9fa" }}>
                                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#999", margin: "0 0 6px 0" }}>{stat.label}</p>
                                <p style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: "#111" }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Agent details row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: "25px", borderTop: "1px solid #e5e7eb", pageBreakInside: "avoid" }}>
                        {/* Bio */}
                        <div style={{ flex: 2, paddingRight: "40px" }}>
                            {agent.agentBio && (
                                <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "16px" }}>
                                    <p style={{ fontSize: "13px", lineHeight: "1.8", color: "#555", margin: 0, fontStyle: "italic" }}>{agent.agentBio}</p>
                                </div>
                            )}
                        </div>
                        {/* Contact */}
                        <div style={{ flex: 1, textAlign: "right", fontSize: "12px", color: "#666", lineHeight: "2" }}>
                            <p style={{ fontWeight: 800, color: "#111", fontSize: "14px", margin: "0 0 4px 0" }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ margin: "2px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ margin: "2px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ margin: "2px 0", color: accent, fontWeight: 600 }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Daily itinerary ── */}
            <div style={{ padding: "0 50px 50px" }}>
                {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "30px", display: "block" }}>

                        {/* Day header — image thumbnail + title side by side */}
                        <div style={{ display: "flex", alignItems: "stretch", gap: "0", marginBottom: "14px", pageBreakInside: "avoid", pageBreakAfter: "avoid", breakInside: "avoid" }}>
                            <img
                                src={getDayImage(day)}
                                alt={formatTitleCase(day.areaFocus)}
                                style={{ width: "90px", height: "90px", objectFit: "cover", flexShrink: 0, display: "block" }}
                                crossOrigin="anonymous"
                            />
                            <div style={{ flex: 1, padding: "12px 18px", background: "#f8f9fa", borderTop: `3px solid ${accent}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                                    <span style={{ fontSize: "28px", fontWeight: 900, color: accent, lineHeight: 1 }}>{String(index + 1).padStart(2, '0')}</span>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", color: "#111" }}>{formatTitleCase(day.areaFocus)}</h3>
                                </div>
                                <div style={{ display: "flex", gap: "16px", marginTop: "5px", fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                                    {day.date && <span>{formatDate(day.date)}</span>}
                                    {(day.dailyStats as any)?.walkingDistance && <span>{formatDistance((day.dailyStats as any).walkingDistance)} km walk</span>}
                                    {day.dailyStats?.totalCost && (!itinerary.pricing || itinerary.pricing.costingType !== 'manual') && (
                                        <span>{formatCurrency(day.dailyStats?.totalCost, itinerary.pricing?.currency || DEFAULT_CURRENCY)}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Activities */}
                        <div style={{ borderTop: "1px solid #eee" }}>
                            {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                                <div key={si} className="pdf-no-cut" style={{ display: "flex", gap: "20px", padding: "12px 16px", margin: "8px 0", background: "#f8f9fa", borderRadius: "6px", pageBreakInside: "avoid" }}>
                                    <div style={{ width: "75px", flexShrink: 0, fontSize: "12px", fontWeight: 700, color: accent }}>{step.time}</div>
                                    <p style={{ flex: 1, margin: 0, fontSize: "13px", lineHeight: "1.6", color: "#444" }}>{step.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Footer ── */}
            <div data-pdf-section="footer" style={{ padding: "16px 50px", borderTop: `3px solid ${accent}`, display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#bbb", textTransform: "uppercase", letterSpacing: "2px", background: "#f8f9fa" }}>
                <span>{agent.companyName}</span>
                <span>{new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};
