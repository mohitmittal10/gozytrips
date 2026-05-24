import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground, glassStyles } from '../styles';
import { PdfDaywiseIndex } from '../pages';

export const CorporateTheme = ({ itinerary, title, agent, finalTotal = 0, showTimestamps = true, showPrices = true, daySummaries }: ThemeProps) => {
    const brandColor = agent.primaryColor || "#0f172a";
    
    return (
        <div style={{ fontFamily: "'Montserrat', 'Helvetica Neue', sans-serif", backgroundColor: "#f8fafc", backgroundImage: `url("${getThematicBackground(itinerary, 'corporate', brandColor)}")`, backgroundRepeat: "repeat", color: "#1e293b", width: "100%" }}>
            {/* Letterhead — cover section */}
            <div data-pdf-section="cover" style={{ paddingBottom: "10px" }}>
                <div style={{ background: brandColor, padding: "35px 50px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 4px 0", letterSpacing: "1.5px", textTransform: "uppercase" }}>{agent.companyName}</h1>
                        <p style={{ fontSize: "11px", opacity: 0.8, margin: 0, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>Travel Management Services</p>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "12px", lineHeight: "1.8", opacity: 0.9, fontWeight: 500 }}>
                        <p style={{ margin: "2px 0", fontWeight: 700, color: "#ffffff" }}>{agent.agentName}</p>
                        {agent.agentPhone && <p style={{ margin: "2px 0", color: "#e2e8f0" }}>{agent.agentPhone}</p>}
                        {agent.agentEmail && <p style={{ margin: "2px 0", color: "#e2e8f0" }}>{agent.agentEmail}</p>}
                    </div>
                </div>

                <div style={{ padding: "40px 50px", background: "rgba(248,250,252,0.38)" }}>
                    {/* Title */}
                    <div style={{ marginBottom: "35px", paddingBottom: "24px", borderBottom: `2px solid ${brandColor}` }}>
                        <h2 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 10px 0", color: brandColor, letterSpacing: "-0.5px" }}>{title}</h2>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0, fontWeight: 600 }}>Document generated: {new Date().toLocaleDateString()} • {itinerary.itinerary?.length || 0}-day comprehensive itinerary</p>
                    </div>

                    {agent.agentBio && (
                        <div style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(148,163,184,0.2)", borderLeft: `4px solid ${brandColor}`, borderRadius: "8px", padding: "20px 24px", marginBottom: "35px", fontSize: "13.5px", color: "#475569", lineHeight: "1.75", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
                            {agent.agentBio}
                        </div>
                    )}

                    {/* Summary table */}
                    <div style={{ ...glassStyles, width: "100%", marginBottom: "40px", fontSize: "13px", display: "flex", flexDirection: "column", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <div style={{ display: "flex", borderBottom: `2px solid ${brandColor}`, background: "rgba(15, 23, 42, 0.04)" }}>
                            <div style={{ padding: "12px 20px", flex: "0 0 40%", color: brandColor, textTransform: "uppercase", fontSize: "11px", letterSpacing: "1.5px", fontWeight: 800 }}>Metric</div>
                            <div style={{ padding: "12px 20px", flex: "0 0 60%", color: brandColor, textTransform: "uppercase", fontSize: "11px", letterSpacing: "1.5px", fontWeight: 800 }}>Details</div>
                        </div>
                        <div style={{ display: "flex", borderBottom: "1px solid rgba(148,163,184,0.18)", background: "rgba(255,255,255,0.56)" }}>
                            <div style={{ padding: "12px 20px", flex: "0 0 40%", fontWeight: 600 }}>Total Duration</div>
                            <div style={{ padding: "12px 20px", flex: "0 0 60%", fontWeight: 700, color: brandColor }}>{itinerary.itinerary?.length || 0} Days</div>
                        </div>
                        <div style={{ display: "flex", borderBottom: "1px solid rgba(148,163,184,0.18)", background: "rgba(255,255,255,0.5)" }}>
                            <div style={{ padding: "12px 20px", flex: "0 0 40%", fontWeight: 600 }}>Estimated Budget</div>
                            <div style={{ padding: "12px 20px", flex: "0 0 60%", fontWeight: 700, color: brandColor }}>{formatCurrency(finalTotal || getTotalBudget(itinerary), (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}</div>
                        </div>
                        <div style={{ display: "flex", borderBottom: "1px solid rgba(148,163,184,0.18)", background: "rgba(255,255,255,0.56)" }}>
                            <div style={{ padding: "12px 20px", flex: "0 0 40%", fontWeight: 600 }}>Total Activities</div>
                            <div style={{ padding: "12px 20px", flex: "0 0 60%", fontWeight: 700, color: brandColor }}>{itinerary.itinerary?.reduce((s, d) => s + (d.timeline?.length || 0), 0) || 0} Scheduled</div>
                        </div>
                        {agent.agentWebsite && (
                            <div style={{ display: "flex", background: "rgba(255,255,255,0.52)" }}>
                                <div style={{ padding: "12px 20px", flex: "0 0 40%", fontWeight: 600 }}>Corporate Website</div>
                                <div style={{ padding: "12px 20px", flex: "0 0 60%", color: brandColor, fontWeight: 700, textDecoration: "underline" }}>{agent.agentWebsite}</div>
                            </div>
                        )}
                    </div>
                </div>{/* end cover section */}
            </div>

            <PdfDaywiseIndex itinerary={itinerary} accentColor={agent.primaryColor} theme="corporate" daySummaries={daySummaries} />

            {/* Daily */}
            <div style={{ padding: "0 50px 50px 50px" }}>
                {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "30px", display: "block" }}>
                        
                        {/* Day header with photo */}
                        <div style={{ background: brandColor, color: "white", padding: "0", display: "flex", alignItems: "stretch", borderRadius: "8px 8px 0 0", overflow: "hidden" }}>
                            <img src={getDayImage(day)} alt={formatTitleCase(day.areaFocus)} style={{ width: "120px", height: "70px", objectFit: "cover", display: "block", flexShrink: 0 }} crossOrigin="anonymous" />
                            <div style={{ padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flex: 1 }}>
                                <h3 style={{ fontSize: "16px", margin: 0, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Day {index + 1}: {formatTitleCase(day.areaFocus)}</h3>
                                <span style={{ fontSize: "12px", opacity: 0.8, fontWeight: 600 }}>{formatDate(day.date)}</span>
                            </div>
                        </div>

                        {/* Activity table */}
                        <div style={{ width: "100%", fontSize: "13.5px", display: "flex", flexDirection: "column", border: "1px solid rgba(148,163,184,0.18)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden", boxShadow: "0 8px 24px rgba(15,23,42,0.05)", background: "rgba(255,255,255,0.34)" }}>
                            <div style={{ display: "flex", background: "rgba(15, 23, 42, 0.06)", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
                                {showTimestamps !== false ? (
                                    <div style={{ padding: "10px 20px", flex: "0 0 120px", color: brandColor, fontSize: "11px", textTransform: "uppercase", fontWeight: 800, letterSpacing: "1px" }}>Time</div>
                                ) : (
                                    <div style={{ flex: "0 0 56px" }} />
                                )}
                                <div style={{ padding: "10px 20px", flex: 1, color: brandColor, fontSize: "11px", textTransform: "uppercase", fontWeight: 800, letterSpacing: "1px" }}>Activity Description</div>
                            </div>
                            {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                                <div key={si} style={{ display: "flex", alignItems: "flex-start", background: si % 2 === 0 ? "rgba(255,255,255,0.54)" : "rgba(248,250,252,0.42)", borderBottom: si === day.timeline.length - 1 ? "none" : "1px solid rgba(148,163,184,0.16)" }}>
                                    {showTimestamps !== false ? (
                                        <div style={{ padding: "14px 20px", flex: "0 0 120px", fontWeight: 700, color: brandColor, lineHeight: "1.6" }}>{step.time}</div>
                                    ) : (
                                        <div style={{ padding: "14px 20px", flex: "0 0 56px", display: "flex", justifyContent: "center" }}>
                                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: brandColor, marginTop: "7px", flexShrink: 0 }} />
                                        </div>
                                    )}
                                    <div style={{ padding: "14px 20px", flex: 1, lineHeight: "1.6", color: "#334155", fontWeight: 500 }}>{step.details}</div>
                                </div>
                            ))}
                        </div>

                        {showPrices !== false && (day as any).dailyStats?.totalCost && (!(itinerary as any).pricing || (itinerary as any).pricing.costingType !== 'manual') && (
                            <div style={{ display: "flex", gap: "30px", padding: "10px 20px", background: "rgba(255,255,255,0.44)", border: "1px solid rgba(148,163,184,0.18)", borderTop: "none", borderRadius: "0 0 8px 8px", fontSize: "12px", color: "#64748b", fontWeight: 700 }}>
                                <span>Day Estimated Budget: {formatCurrency((day as any).dailyStats?.totalCost, (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div data-pdf-section="footer" style={{ padding: "30px 50px", borderTop: `2px solid ${brandColor}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#475569", fontWeight: 600, background: "rgba(255,255,255,0.46)" }}>
                <span>Confidential · Prepared for client by {agent.companyName}</span>
                <span>Page generated: {new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};


