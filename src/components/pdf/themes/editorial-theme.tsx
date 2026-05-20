import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground, glassStyles } from '../styles';

export const EditorialTheme = ({ itinerary, title, agent, finalTotal = 0, showTimestamps = true, showPrices = true }: ThemeProps) => {
    const gold = agent.primaryColor || "#b8860b";
    
    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', 'Georgia', serif", backgroundColor: "#fdfcfa", backgroundImage: `url("${getThematicBackground(itinerary, 'editorial', gold)}")`, backgroundRepeat: "repeat", color: "#2c2c2c", width: "100%" }}>
            {/* Cover */}
            <div data-pdf-section="cover" style={{ paddingBottom: "10px" }}>
                <div style={{ position: "relative", height: "460px", overflow: "hidden" }}>
                    <img src={getCoverImage(itinerary)} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "65%", background: "linear-gradient(to top, rgba(15,23,42,0.9) 10%, rgba(15,23,42,0.3) 60%, transparent)" }} />
                    <div style={{ position: "absolute", bottom: "50px", left: "60px", right: "60px", color: "white", zIndex: 1 }}>
                        <p style={{ fontSize: "12px", letterSpacing: "5px", textTransform: "uppercase", margin: "0 0 15px 0", color: gold, fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>{agent.companyName}</p>
                        <h1 style={{ fontSize: "48px", fontWeight: "normal", margin: "0 0 20px 0", lineHeight: "1.15", fontFamily: "'Playfair Display', serif", fontStyle: "italic", letterSpacing: "-0.5px" }}>{title}</h1>
                        <div style={{ width: "80px", height: "2px", background: gold, marginBottom: "20px" }} />
                        <p style={{ fontSize: "14px", opacity: 0.9, margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>{itinerary.itinerary?.length || 0}-Day Curated Journey • Designed by {agent.agentName}</p>
                    </div>
                </div>

                <div style={{ padding: "50px 60px 20px 60px", background: "rgba(253,252,250,0.2)" }}>
                    {/* Agent info */}
                    <div style={{ display: "flex", gap: "60px", marginBottom: "40px", borderBottom: `1px solid rgba(${gold === "#b8860b" ? "184,134,11" : "15,23,42"}, 0.15)`, paddingBottom: "35px", pageBreakInside: "avoid" }}>
                        <div style={{ flex: 2 }}>
                            {agent.agentBio && (
                                <blockquote style={{ fontSize: "18px", lineHeight: "1.85", color: "#475569", fontStyle: "italic", margin: 0, padding: "24px", borderRadius: "16px", fontFamily: "'Playfair Display', serif", borderLeft: `3px solid ${gold}`, ...glassStyles }}>
                                    &ldquo;{agent.agentBio}&rdquo;
                                </blockquote>
                            )}
                        </div>
                        <div style={{ flex: 1, fontSize: "13px", color: "#64748b", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: "2.1", alignSelf: "center" }}>
                            <p style={{ fontWeight: 800, color: "#0f172a", fontSize: "15px", margin: "0 0 12px 0", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ margin: "2px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ margin: "2px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ margin: "4px 0", color: gold, fontWeight: 700 }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>

                    {/* Metric strip */}
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "40px", marginBottom: "40px", textAlign: "center", pageBreakInside: "avoid", background: "rgba(255,255,255,0.22)", border: "1px solid rgba(184,134,11,0.08)", borderRadius: "20px", padding: "24px 28px", boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 4px 0", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{itinerary.itinerary?.length || 0}</p>
                            <p style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "3px", color: "#94a3b8", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, fontWeight: 700 }}>Days Away</p>
                        </div>
                        <div style={{ width: "1px", background: "#e2e8f0" }} />
                        <div style={{ flex: 2 }}>
                            <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 4px 0", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{formatCurrency(finalTotal || getTotalBudget(itinerary), itinerary.pricing?.currency || DEFAULT_CURRENCY)}</p>
                            <p style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "3px", color: "#94a3b8", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, fontWeight: 700 }}>Bespoke Valuation</p>
                        </div>
                        <div style={{ width: "1px", background: "#e2e8f0" }} />
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 4px 0", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{itinerary.itinerary?.reduce((s, d) => s + (d.timeline?.length || 0), 0) || 0}</p>
                            <p style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "3px", color: "#94a3b8", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, fontWeight: 700 }}>Events</p>
                        </div>
                    </div>
                </div>{/* end cover */}
            </div>

            {/* Daily */}
            {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "20px", padding: "40px 60px", display: "block", background: "rgba(253,252,250,0.12)" }}>
                    
                    {/* Photo header */}
                    <div style={{ height: "260px", marginBottom: "30px", borderRadius: "12px", overflow: "hidden", pageBreakInside: "avoid", pageBreakAfter: "avoid", position: "relative", display: "block" }}>
                        <img src={getDayImage(day)} alt={formatTitleCase(day.areaFocus)} style={{ width: "100%", height: "260px", objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,23,42,0.85) 15%, transparent)" }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "30px 35px" }}>
                            <p style={{ color: gold, fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 6px 0", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>Day {String(index + 1).padStart(2, '0')} • {formatDate(day.date)}</p>
                            <h3 style={{ color: "white", fontSize: "28px", fontWeight: "normal", margin: 0, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{formatTitleCase(day.areaFocus)}</h3>
                        </div>
                    </div>

                    {/* Activities */}
                    <div style={{ padding: "24px 28px 24px 10px", display: "flex", flexDirection: "column", gap: "25px", background: "rgba(255,255,255,0.18)", borderRadius: "16px", border: "1px solid rgba(184,134,11,0.08)", boxShadow: "0 10px 30px rgba(15,23,42,0.03)" }}>
                        {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                            <div key={si} className="pdf-no-cut" style={{ display: "flex", alignItems: "flex-start", gap: "18px", paddingLeft: "24px", borderLeft: `1.5px solid ${gold}`, pageBreakInside: "avoid" }}>
                                {showTimestamps !== false ? (
                                    <p style={{ fontSize: "12.5px", color: gold, fontWeight: 800, margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "1.5px", width: "74px", flexShrink: 0, lineHeight: "1.85", textTransform: "uppercase" }}>{step.time}</p>
                                ) : (
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: gold, marginTop: "10px", flexShrink: 0 }} />
                                )}
                                <p style={{ fontSize: "15px", lineHeight: "1.85", color: "#334155", margin: 0, fontWeight: 500, flex: 1 }}>{step.details}</p>
                            </div>
                        ))}
                    </div>

                    {showPrices !== false && day.dailyStats?.totalCost && (!itinerary.pricing || itinerary.pricing.costingType !== 'manual') && (
                        <div style={{ display: "flex", gap: "30px", marginTop: "24px", paddingTop: "15px", borderTop: "1px solid #e2e8f0", fontSize: "12px", color: gold, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, pageBreakInside: "avoid" }}>
                            <span>EST. COST FOR THE DAY: {formatCurrency(day.dailyStats?.totalCost, itinerary.pricing?.currency || DEFAULT_CURRENCY)}</span>
                        </div>
                    )}
                </div>
            ))}

            {/* Footer */}
            <div data-pdf-section="footer" style={{ padding: "40px 60px", borderTop: `1px solid rgba(${gold === "#b8860b" ? "184,134,11" : "15,23,42"}, 0.15)`, textAlign: "center" }}>
                <p style={{ fontSize: "13px", letterSpacing: "5px", textTransform: "uppercase", color: gold, margin: "0 0 10px 0", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>{agent.companyName}</p>
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Generated on {new Date().toLocaleDateString()} · Editorial Edition</p>
            </div>
        </div>
    );
};

