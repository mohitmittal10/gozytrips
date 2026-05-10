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
};

export const ClassicTheme = ({ itinerary, title, agent, finalTotal = 0 }: ThemeProps) => (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#f8fafc", backgroundImage: `url("${getThematicBackground(itinerary, 'classic', agent.primaryColor)}")`, backgroundRepeat: "repeat", color: "#1e293b", width: "100%" }}>
        {/* Hero — cover section */}
        <div data-pdf-section="cover">
            <div style={{ position: "relative", height: "280px", overflow: "hidden", marginBottom: "30px" }}>
                <img src={getCoverImage(itinerary)} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to right, rgba(168,85,247,0.8), rgba(236,72,153,0.8))" }} />
                <div style={{ position: "absolute", bottom: "40px", left: "40px", zIndex: 1, color: "white" }}>
                    <h1 style={{ fontSize: "44px", fontWeight: "bold", margin: "0 0 10px 0", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>{title}</h1>
                    <p style={{ fontSize: "18px", opacity: 0.95, margin: 0, fontWeight: 500 }}>Prepared for your upcoming journey.</p>
                </div>
            </div>

            <div style={{ padding: "0 40px" }}>
                {/* Agent details */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "25px", marginBottom: "30px", pageBreakInside: "avoid" }}>
                    <div style={{ maxWidth: "60%" }}>
                        {agent.agentBio && (
                            <div style={{ padding: "15px 20px", borderRadius: "8px", borderLeft: `4px solid ${agent.primaryColor}`, fontStyle: "italic", color: "#475569", fontSize: "14px", lineHeight: "1.6", ...glassStyles }}>
                                &quot;{agent.agentBio}&quot;
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <h2 style={{ fontSize: "22px", margin: "0 0 5px 0", color: "#0f172a", fontWeight: "bold" }}>{agent.companyName}</h2>
                        <p style={{ color: "#334155", fontSize: "14px", margin: "0 0 8px 0", fontWeight: 600 }}>{agent.agentName}</p>
                        {agent.agentPhone && <p style={{ color: "#64748b", fontSize: "13px", margin: "3px 0" }}>{agent.agentPhone}</p>}
                        {agent.agentEmail && <p style={{ color: "#64748b", fontSize: "13px", margin: "3px 0" }}>{agent.agentEmail}</p>}
                        {agent.agentWebsite && <p style={{ color: agent.primaryColor, fontSize: "13px", margin: "3px 0", fontWeight: 500 }}>{agent.agentWebsite}</p>}
                    </div>
                </div>

                {/* Stat cards */}
                <div style={{ display: "flex", gap: "20px", marginBottom: "40px", pageBreakInside: "avoid" }}>
                    <div style={{ flex: 1, borderRadius: "12px", padding: "20px", borderLeft: "4px solid #a855f7", ...glassStyles }}>
                        <h3 style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Duration</h3>
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>{itinerary.itinerary?.length || 0} Days</p>
                    </div>
                    <div style={{ flex: 1, borderRadius: "12px", padding: "20px", borderLeft: "4px solid #ec4899", ...glassStyles }}>
                        <h3 style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Total Budget</h3>
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>{formatCurrency(finalTotal || getTotalBudget(itinerary), itinerary.pricing?.currency || DEFAULT_CURRENCY)}</p>
                    </div>
                </div>

            </div>{/* end cover section */}
        </div>
        {/* Daily itineraries */}
        {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
            <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "10px", display: "block" }}>

                {/* Photo + header block — NO overflow:hidden, image is self-clipping */}
                <div style={{ display: "block", border: "1px solid #e2e8f0", borderBottom: "none", borderRadius: "16px 16px 0 0", pageBreakInside: "avoid" }}>
                    {/* Image wrapper: fixed height, clips via object-fit without overflow:hidden */}
                    <div style={{ height: "180px", display: "block", borderRadius: "16px 16px 0 0" }}>
                        <img src={getDayImage(day)} alt={formatTitleCase(day.areaFocus)} style={{ width: "100%", height: "180px", objectFit: "cover", display: "block", borderRadius: "16px 16px 0 0" }} crossOrigin="anonymous" />
                    </div>
                    <div style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)", padding: "16px 25px", color: "white" }}>
                        <span style={{ fontSize: "14px", opacity: 0.9, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Day {index + 1} • {formatDate(day.date)}</span>
                        <h3 style={{ margin: "5px 0 0 0", fontSize: "22px", fontWeight: "bold" }}>{formatTitleCase(day.areaFocus)}</h3>
                    </div>
                </div>

                {/* Timeline steps — each step self-contained */}
                <div style={{ borderRadius: "0 0 16px 16px", padding: "20px 25px", ...glassStyles }}>
                    {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                        <div key={si} className="pdf-no-cut" style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: si === day.timeline.length - 1 ? "0" : "14px", paddingBottom: si === day.timeline.length - 1 ? "0" : "14px", borderBottom: si === day.timeline.length - 1 ? "none" : "1px solid rgba(255,255,255,0.4)", pageBreakInside: "avoid", breakInside: "avoid" }}>
                            <span style={{ fontWeight: "bold", color: "#a855f7", fontSize: "13px", background: "rgba(243, 232, 255, 0.7)", padding: "5px 14px", borderRadius: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, minWidth: "90px", textAlign: "center" }}>{step.time}</span>
                            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#475569", flex: 1 }}>{step.details}</p>
                        </div>
                    ))}
                    <div style={{ marginTop: "18px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.4)", display: "flex", gap: "20px", fontSize: "13px", color: "#64748b", fontWeight: 500, pageBreakInside: "avoid", breakInside: "avoid" }}>
                        <div>🏃‍♂️ Distance: {formatDistance((day.dailyStats as any)?.walkingDistance)} km</div>
                        {day.dailyStats?.totalCost && (!itinerary.pricing || itinerary.pricing.costingType !== 'manual') && (
                            <div>💰 Budget: {formatCurrency(day.dailyStats?.totalCost, itinerary.pricing?.currency || DEFAULT_CURRENCY)}</div>
                        )}
                    </div>
                </div>
            </div>
        ))}

        {/* Footer */}
        <div data-pdf-section="footer" style={{ marginTop: "40px", padding: "30px 40px", background: "#0f172a", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px", background: "linear-gradient(to right, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{agent.companyName}</div>
            <p style={{ margin: "0 0 5px 0", color: "#94a3b8", fontSize: "14px" }}>Your Personal AI Travel Architect</p>
            <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>Generated on: {new Date().toLocaleDateString()}</p>
        </div>
    </div>
);
