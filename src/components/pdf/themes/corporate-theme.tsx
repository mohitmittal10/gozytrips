import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground, glassStyles } from '../styles';

export const CorporateTheme = ({ itinerary, title, agent }: ThemeProps) => {
    const navy = "#003366";
    return (
        <div style={{ fontFamily: "'Helvetica', 'Arial', sans-serif", backgroundColor: "#f4f6f8", backgroundImage: `url("${getThematicBackground(itinerary, 'corporate', navy)}")`, backgroundRepeat: "repeat", color: "#333", width: "100%" }}>
            {/* Letterhead — cover section */}
            <div data-pdf-section="cover">
                <div style={{ background: navy, padding: "30px 50px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 4px 0", letterSpacing: "1px" }}>{agent.companyName}</h1>
                        <p style={{ fontSize: "12px", opacity: 0.7, margin: 0 }}>Travel Management Services</p>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "12px", lineHeight: "1.8", opacity: 0.85 }}>
                        <p style={{ margin: "2px 0", fontWeight: "bold" }}>{agent.agentName}</p>
                        {agent.agentPhone && <p style={{ margin: "2px 0" }}>{agent.agentPhone}</p>}
                        {agent.agentEmail && <p style={{ margin: "2px 0" }}>{agent.agentEmail}</p>}
                    </div>
                </div>

                <div style={{ padding: "40px 50px" }}>
                    {/* Title */}
                    <div style={{ marginBottom: "30px", paddingBottom: "20px", borderBottom: `3px solid ${navy}`, pageBreakInside: "avoid" }}>
                        <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 8px 0", color: navy }}>{title}</h2>
                        <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>Document generated on {new Date().toLocaleDateString()} • {itinerary.itinerary?.length || 0}-day itinerary</p>
                    </div>

                    {agent.agentBio && (
                        <div style={{ background: "#f7f9fc", border: "1px solid #e0e6ed", borderRadius: "4px", padding: "15px 20px", marginBottom: "30px", fontSize: "13px", color: "#555", lineHeight: "1.7", pageBreakInside: "avoid" }}>
                            {agent.agentBio}
                        </div>
                    )}

                    {/* Summary table */}
                    <div style={{ width: "100%", marginBottom: "35px", fontSize: "13px", display: "flex", flexDirection: "column", borderRadius: "12px", ...glassStyles }}>
                        <div style={{ display: "flex", borderBottom: `2px solid ${navy}`, background: "rgba(0,51,102,0.05)", borderRadius: "12px 12px 0 0" }}>
                            <div style={{ padding: "10px 15px", flex: "0 0 40%", color: navy, textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px", fontWeight: "bold" }}>Metric</div>
                            <div style={{ padding: "10px 15px", flex: "0 0 60%", color: navy, textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px", fontWeight: "bold" }}>Details</div>
                        </div>
                        <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
                            <div style={{ padding: "10px 15px", flex: "0 0 40%" }}>Total Duration</div>
                            <div style={{ padding: "10px 15px", flex: "0 0 60%", fontWeight: "bold" }}>{itinerary.itinerary?.length || 0} Days</div>
                        </div>
                        <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
                            <div style={{ padding: "10px 15px", flex: "0 0 40%" }}>Estimated Budget</div>
                            <div style={{ padding: "10px 15px", flex: "0 0 60%", fontWeight: "bold" }}>{formatCurrency(getTotalBudget(itinerary), itinerary.pricing?.currency || DEFAULT_CURRENCY)}</div>
                        </div>
                        <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
                            <div style={{ padding: "10px 15px", flex: "0 0 40%" }}>Total Activities</div>
                            <div style={{ padding: "10px 15px", flex: "0 0 60%", fontWeight: "bold" }}>{itinerary.itinerary?.reduce((s, d) => s + (d.timeline?.length || 0), 0) || 0}</div>
                        </div>
                        {agent.agentWebsite && (
                            <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
                                <div style={{ padding: "10px 15px", flex: "0 0 40%" }}>Website</div>
                                <div style={{ padding: "10px 15px", flex: "0 0 60%", color: navy }}>{agent.agentWebsite}</div>
                            </div>
                        )}
                    </div>
                </div>{/* end cover section */}
            </div>
            {/* Daily */}
            {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "10px", display: "block" }}>
                    {/* Day header with photo — keep together */}
                    <div style={{ background: navy, color: "white", padding: "0", display: "flex", alignItems: "stretch", pageBreakInside: "avoid", pageBreakAfter: "avoid", breakInside: "avoid" }}>
                        <img src={getDayImage(day)} alt={formatTitleCase(day.areaFocus)} style={{ width: "100px", height: "60px", objectFit: "cover", display: "block", flexShrink: 0 }} crossOrigin="anonymous" />
                        <div style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flex: 1 }}>
                            <h3 style={{ fontSize: "15px", margin: 0, fontWeight: "bold" }}>Day {index + 1}: {formatTitleCase(day.areaFocus)}</h3>
                            <span style={{ fontSize: "12px", opacity: 0.8 }}>{formatDate(day.date)}</span>
                        </div>
                    </div>

                    {/* Activity table — each row avoids break */}
                    <div style={{ width: "100%", fontSize: "13px", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", background: "#f7f9fc", borderBottom: "1px solid #ddd" }}>
                            <div style={{ padding: "8px 15px", flex: "0 0 100px", color: "#555", fontSize: "11px", textTransform: "uppercase", fontWeight: "bold" }}>Time</div>
                            <div style={{ padding: "8px 15px", flex: 1, color: "#555", fontSize: "11px", textTransform: "uppercase", fontWeight: "bold" }}>Activity</div>
                        </div>
                        {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                            <div key={si} className="pdf-no-cut" style={{ display: "flex", background: si % 2 === 0 ? "#ffffff" : "#fafbfc", pageBreakInside: "avoid", borderBottom: "1px solid #eee" }}>
                                <div style={{ padding: "10px 15px", flex: "0 0 100px", fontWeight: "bold", color: navy }}>{step.time}</div>
                                <div style={{ padding: "10px 15px", flex: 1, lineHeight: "1.5", color: "#444" }}>{step.details}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: "30px", padding: "8px 15px", background: "#f7f9fc", borderBottom: "1px solid #ddd", fontSize: "12px", color: "#666", pageBreakInside: "avoid" }}>
                        {(day.dailyStats as any)?.walkingDistance && <span>Walking: {formatDistance((day.dailyStats as any).walkingDistance)} km</span>}
                        {day.dailyStats?.totalCost && <span>Est. Cost: {formatCurrency(day.dailyStats?.totalCost, itinerary.pricing?.currency || DEFAULT_CURRENCY)}</span>}
                    </div>
                </div>
            ))}

            {/* Footer */}
            <div data-pdf-section="footer" style={{ padding: "20px 50px", borderTop: `2px solid ${navy}`, display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#999" }}>
                <span>Confidential — Prepared by {agent.companyName}</span>
                <span>Page generated: {new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};
