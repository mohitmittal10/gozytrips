import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground, glassStyles } from '../styles';

export const EditorialTheme = ({ itinerary, title, agent, finalTotal = 0 }: ThemeProps) => {
    const gold = "#b8860b";
    return (
        <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", backgroundColor: "#fdfcfa", backgroundImage: `url("${getThematicBackground(itinerary, 'editorial', gold)}")`, backgroundRepeat: "repeat", color: "#2c2c2c", width: "100%" }}>
            {/* Cover */}
            <div data-pdf-section="cover">
                <div style={{ position: "relative", height: "480px", overflow: "hidden" }}>
                    <img src={getCoverImage(itinerary)} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                    <div style={{ position: "absolute", bottom: "50px", left: "60px", right: "60px", color: "white", zIndex: 1 }}>
                        <p style={{ fontSize: "14px", letterSpacing: "4px", textTransform: "uppercase", margin: "0 0 15px 0", color: gold, fontFamily: "'Helvetica Neue', sans-serif" }}>{agent.companyName}</p>
                        <h1 style={{ fontSize: "52px", fontWeight: "normal", margin: "0 0 15px 0", lineHeight: "1.1", fontStyle: "italic" }}>{title}</h1>
                        <div style={{ width: "60px", height: "2px", background: gold, marginBottom: "15px" }} />
                        <p style={{ fontSize: "16px", opacity: 0.85, margin: 0, fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 300 }}>{itinerary.itinerary?.length || 0}-Day Journey • Curated by {agent.agentName}</p>
                    </div>
                </div>

                <div style={{ padding: "50px 60px" }}>
                    {/* Agent info */}
                    <div style={{ display: "flex", gap: "60px", marginBottom: "50px", borderBottom: `1px solid ${gold}`, paddingBottom: "40px", pageBreakInside: "avoid" }}>
                        <div style={{ flex: 2 }}>
                            {agent.agentBio && (
                                <blockquote style={{ fontSize: "20px", lineHeight: "1.8", color: "#555", fontStyle: "italic", margin: 0, padding: "20px", borderRadius: "12px", ...glassStyles }}>
                                    &ldquo;{agent.agentBio}&rdquo;
                                </blockquote>
                            )}
                        </div>
                        <div style={{ flex: 1, fontSize: "13px", color: "#666", fontFamily: "'Helvetica Neue', sans-serif", lineHeight: "2" }}>
                            <p style={{ fontWeight: "bold", color: "#333", fontSize: "15px", margin: "0 0 10px 0" }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ margin: "4px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ margin: "4px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ margin: "4px 0", color: gold }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>

                    {/* Metric strip */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "80px", marginBottom: "60px", textAlign: "center", pageBreakInside: "avoid", pageBreakAfter: "always" }}>
                        <div>
                            <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 5px 0", fontStyle: "italic" }}>{itinerary.itinerary?.length || 0}</p>
                            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "3px", color: "#999", fontFamily: "'Helvetica Neue', sans-serif", margin: 0 }}>Days</p>
                        </div>
                        <div style={{ width: "1px", background: "#ddd" }} />
                        <div>
                            <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 5px 0", fontStyle: "italic" }}>{formatCurrency(finalTotal || getTotalBudget(itinerary), itinerary.pricing?.currency || DEFAULT_CURRENCY)}</p>
                            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "3px", color: "#999", fontFamily: "'Helvetica Neue', sans-serif", margin: 0 }}>Estimated Budget</p>
                        </div>
                        <div style={{ width: "1px", background: "#ddd" }} />
                        <div>
                            <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 5px 0", fontStyle: "italic" }}>{itinerary.itinerary?.reduce((s, d) => s + (d.timeline?.length || 0), 0) || 0}+</p>
                            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "3px", color: "#999", fontFamily: "'Helvetica Neue', sans-serif", margin: 0 }}>Experiences</p>
                        </div>
                    </div>

                </div>{/* end cover */}
            </div>
            {/* Daily */}
            {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "20px", padding: "50px 60px" }}>
                    {/* Photo header — NO overflow:hidden so canvas slicing doesn't clip it */}
                    <div style={{ height: "250px", marginBottom: "0", pageBreakInside: "avoid", pageBreakAfter: "avoid", position: "relative", display: "block" }}>
                        <img src={getDayImage(day)} alt={formatTitleCase(day.areaFocus)} style={{ width: "100%", height: "250px", objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "30px 30px 20px 30px", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
                            <p style={{ color: gold, fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 6px 0", fontFamily: "'Helvetica Neue', sans-serif" }}>Day {String(index + 1).padStart(2, '0')} • {formatDate(day.date)}</p>
                            <h3 style={{ color: "white", fontSize: "28px", fontWeight: "normal", margin: 0, fontStyle: "italic" }}>{formatTitleCase(day.areaFocus)}</h3>
                        </div>
                    </div>
                    <div style={{ marginBottom: "30px" }} />

                    {/* Activities */}
                    {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                        <div key={si} style={{ marginBottom: "20px", paddingLeft: "20px", borderLeft: `2px solid ${gold}`, pageBreakInside: "avoid" }}>
                            <p style={{ fontSize: "13px", color: gold, fontWeight: "bold", margin: "0 0 6px 0", fontFamily: "'Helvetica Neue', sans-serif", letterSpacing: "1px" }}>{step.time}</p>
                            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "#444", margin: 0 }}>{step.details}</p>
                        </div>
                    ))}

                    <div style={{ display: "flex", gap: "30px", marginTop: "15px", fontSize: "12px", color: "#999", fontFamily: "'Helvetica Neue', sans-serif", pageBreakInside: "avoid" }}>
                        {(day.dailyStats as any)?.walkingDistance && <span>{formatDistance((day.dailyStats as any).walkingDistance)} km walking</span>}
                        {day.dailyStats?.totalCost && (!itinerary.pricing || itinerary.pricing.costingType !== 'manual') && (
                            <span>Est. {formatCurrency(day.dailyStats?.totalCost, itinerary.pricing?.currency || DEFAULT_CURRENCY)}</span>
                        )}
                    </div>
                </div>
            ))}

            {/* Footer */}
            <div data-pdf-section="footer" style={{ padding: "40px 60px", borderTop: `2px solid ${gold}`, textAlign: "center" }}>
                <p style={{ fontSize: "14px", letterSpacing: "4px", textTransform: "uppercase", color: gold, margin: "0 0 8px 0" }}>{agent.companyName}</p>
                <p style={{ fontSize: "12px", color: "#999", margin: 0, fontFamily: "'Helvetica Neue', sans-serif" }}>Generated on {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

