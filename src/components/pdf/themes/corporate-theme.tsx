import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground, glassStyles } from '../styles';
import { PdfDaywiseIndex } from '../pages';
import { calcPricingFromBaseCost } from '@/services/financial';

const parseList = (text?: string) => {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s !== '-');
};

export const CorporateTheme = ({
    itinerary, title, clientName, agencySettings, agent, hotels = [], flights = [], cabs = [], buses = [], pricing, baseCost = 0, finalTotal = 0, showTimestamps = true, showPrices = true, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods, daySummaries, aboutPlace
}: ThemeProps) => {
    const brandColor = agent.primaryColor || "#0f172a";
    const totalActivities = Array.isArray(itinerary.itinerary) ? itinerary.itinerary.reduce((s, d) => s + (d.timeline?.length || 0), 0) : 0;
    const currency = pricing?.currency || DEFAULT_CURRENCY;
    const isManual = pricing?.costingType === 'manual';
    const adultPax = Number(pricing?.adultPax || 2);
    const childPax = Number(pricing?.childPax || 0);
    const resolvedBase = baseCost || 0;
    const { costWithMarkup, taxAmount } = calcPricingFromBaseCost(resolvedBase, pricing);

    const inclusionsList = parseList(inclusions);
    const exclusionsList = parseList(exclusions);

    return (
        <div className="corporate-wrap" style={{ fontFamily: "'Montserrat', 'Helvetica Neue', sans-serif", backgroundColor: "#f8fafc", backgroundImage: `url("${getThematicBackground(itinerary, 'corporate', brandColor)}")`, backgroundRepeat: "repeat", color: "#1e293b", width: "100%" }}>
            <style>
                {`
                .corporate-wrap *, .corporate-wrap *::before, .corporate-wrap *::after { box-sizing: border-box; }

                .corporate-wrap .table-wrap {
                    overflow-x: auto;
                    border-radius: 8px;
                    border: 1px solid rgba(148,163,184,0.3);
                    background: rgba(255,255,255,0.8);
                    margin-bottom: 40px;
                }
                .corporate-wrap table { width: 100%; border-collapse: collapse; table-layout: fixed; display: table !important; }
                .corporate-wrap thead { display: table-header-group !important; }
                .corporate-wrap tbody { display: table-row-group !important; }
                .corporate-wrap tr { display: table-row !important; }
                .corporate-wrap th {
                    padding: 16px 20px;
                    font-size: 11px;
                    color: ${brandColor};
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 800;
                    border-bottom: 1px solid rgba(148,163,184,0.3);
                    text-align: left;
                    display: table-cell !important;
                }
                .corporate-wrap th:last-child { text-align: right; }
                .corporate-wrap th:nth-child(2), .corporate-wrap th:nth-child(3) { text-align: center; }
                .corporate-wrap td {
                    padding: 16px 20px;
                    font-size: 13px;
                    color: #334155;
                    font-weight: 500;
                    border-bottom: 1px solid rgba(148,163,184,0.15);
                    vertical-align: middle;
                    display: table-cell !important;
                }
                .corporate-wrap tbody tr:last-child td { border-bottom: none; }
                .corporate-wrap td:first-child { font-weight: 700; color: #0f172a; text-align: left; }
                .corporate-wrap td:nth-child(2), .corporate-wrap td:nth-child(3) { text-align: center; color: #475569; }
                .corporate-wrap td:last-child { text-align: right; font-family: var(--font-mono); font-weight: 700; color: #0f172a; }

                .corporate-wrap .invoice-table th:nth-child(1) { width: 55%; }
                .corporate-wrap .invoice-table th:nth-child(2) { width: 10%; }
                .corporate-wrap .invoice-table th:nth-child(3) { width: 15%; }
                .corporate-wrap .invoice-table th:nth-child(4) { width: 20%; }

                .corporate-wrap .payment-table th:nth-child(1) { width: 40%; }
                .corporate-wrap .payment-table th:nth-child(2) { width: 20%; }
                .corporate-wrap .payment-table th:nth-child(3) { width: 20%; }
                .corporate-wrap .payment-table th:nth-child(4) { width: 20%; }
                `}
            </style>
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

            {/* About The Destination */}
            {aboutPlace && (
                <div data-pdf-section="about" style={{ padding: "10px 50px 40px 50px", pageBreakInside: "avoid" }}>
                    <div style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "8px", overflow: "hidden", display: "flex", gap: "0" }}>
                        <div style={{ flex: "0 0 280px" }}>
                            <img src={Array.isArray(itinerary.itinerary) && itinerary.itinerary.length > 0 ? getDayImage(itinerary.itinerary[0]) : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop"} alt="Destination" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
                        </div>
                        <div style={{ flex: 1, padding: "30px 40px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                <div style={{ width: "24px", height: "2px", background: brandColor }} />
                                <h3 style={{ margin: 0, fontSize: "11px", color: brandColor, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800 }}>Destination Overview</h3>
                            </div>
                            <h2 style={{ margin: "0 0 16px 0", fontSize: "24px", color: "#0f172a", fontWeight: 800, letterSpacing: "-0.5px" }}>{aboutPlace.title}</h2>
                            <p style={{ margin: "0 0 20px 0", color: "#475569", fontSize: "13.5px", lineHeight: "1.7", fontWeight: 500 }}>{aboutPlace.description}</p>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                {(aboutPlace.highlights || []).map((hl: string, i: number) => (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                        <div style={{ flexShrink: 0, width: "6px", height: "6px", borderRadius: "1px", background: brandColor, marginTop: "6px" }} />
                                        <span style={{ fontSize: "12px", color: "#334155", fontWeight: 600 }}>{hl}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Travel & Logistics */}
            {(hotels.length > 0 || flights.length > 0 || cabs.length > 0 || buses.length > 0) && (
                <div data-pdf-section="accommodations" style={{ padding: "0 50px 40px 50px" }}>
                    <div style={{ marginBottom: "24px", paddingBottom: "16px", borderBottom: `2px solid ${brandColor}` }}>
                        <h2 style={{ margin: 0, fontSize: "20px", color: brandColor, fontWeight: 800, letterSpacing: "-0.5px" }}>Travel & Logistics</h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
                        {hotels.map((h, i) => (
                            <div key={`hotel-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(148,163,184,0.2)", padding: "16px", background: "rgba(255,255,255,0.7)", borderRadius: "8px" }}>
                                <img src={h.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop'} alt={h.name} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px" }} crossOrigin="anonymous" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: brandColor, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Hotel • Day {h.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#0f172a", fontWeight: 700 }}>{h.name}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", fontSize: "11px", color: "#475569" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "2px" }}><span>Check-in</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{h.checkIn}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "2px" }}><span>Check-out</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{h.checkOut}</span></div>
                                        {h.bookingRef && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Reference</span><span style={{ fontWeight: 600, color: brandColor }}>{h.bookingRef}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {flights.map((f, i) => (
                            <div key={`flight-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(148,163,184,0.2)", padding: "16px", background: "rgba(255,255,255,0.7)", borderRadius: "8px" }}>
                                <div style={{ width: "80px", height: "80px", background: "rgba(15,23,42,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", borderRadius: "4px" }}>✈️</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: brandColor, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Flight • Day {f.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#0f172a", fontWeight: 700 }}>{f.airline}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", fontSize: "11px", color: "#475569" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "2px" }}><span>Route</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{f.departureAirport} → {f.arrivalAirport}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "2px" }}><span>Departure</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{f.departure}</span></div>
                                        {f.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span>PNR</span><span style={{ fontWeight: 600, color: brandColor }}>{f.pnr}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {cabs.map((c, i) => (
                            <div key={`cab-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(148,163,184,0.2)", padding: "16px", background: "rgba(255,255,255,0.7)", borderRadius: "8px" }}>
                                <div style={{ width: "80px", height: "80px", background: "rgba(15,23,42,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", borderRadius: "4px" }}>🚕</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: brandColor, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Transfer • Day {c.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#0f172a", fontWeight: 700 }}>{c.vehicleType || "Private Transfer"}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", fontSize: "11px", color: "#475569" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "2px" }}><span>Route</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{c.route || "Local"}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "2px" }}><span>Pickup</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{c.pickupTime}</span></div>
                                        {c.driverName && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Driver</span><span style={{ fontWeight: 600, color: brandColor }}>{c.driverName}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {buses.map((b, i) => (
                            <div key={`bus-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(148,163,184,0.2)", padding: "16px", background: "rgba(255,255,255,0.7)", borderRadius: "8px" }}>
                                <div style={{ width: "80px", height: "80px", background: "rgba(15,23,42,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", borderRadius: "4px" }}>🚌</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: brandColor, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Bus • Day {b.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#0f172a", fontWeight: 700 }}>{b.busType || "Tourist Bus"}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", fontSize: "11px", color: "#475569" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "2px" }}><span>Route</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{b.route}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "2px" }}><span>Departure</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{b.departureTime}</span></div>
                                        {b.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span>PNR</span><span style={{ fontWeight: 600, color: brandColor }}>{b.pnr}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inclusions & Exclusions */}
            <div data-pdf-section="inclusions" style={{ padding: "0 50px 40px 50px" }}>
                <div style={{ display: "flex", gap: "30px" }}>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "8px", overflow: "hidden" }}>
                        <div style={{ background: "rgba(15, 23, 42, 0.04)", padding: "16px 20px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                            <h3 style={{ margin: 0, fontSize: "13px", color: brandColor, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>Inclusions</h3>
                        </div>
                        <ul style={{ margin: 0, padding: "20px", listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {inclusionsList.length > 0 ? inclusionsList.map((inc, i) => (
                                <li key={i} style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#334155", fontWeight: 500 }}><span style={{ color: brandColor }}>✓</span> <span>{inc}</span></li>
                            )) : <li style={{ fontSize: "13px", color: "#64748b" }}>Standard inclusions apply.</li>}
                        </ul>
                    </div>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "8px", overflow: "hidden" }}>
                        <div style={{ background: "rgba(15, 23, 42, 0.04)", padding: "16px 20px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                            <h3 style={{ margin: 0, fontSize: "13px", color: brandColor, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>Exclusions</h3>
                        </div>
                        <ul style={{ margin: 0, padding: "20px", listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {exclusionsList.length > 0 ? exclusionsList.map((exc, i) => (
                                <li key={i} style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#475569", fontWeight: 500 }}><span style={{ color: "#94a3b8" }}>✗</span> <span>{exc}</span></li>
                            )) : <li style={{ fontSize: "13px", color: "#64748b" }}>Personal expenses not included.</li>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Pricing & Invoice */}
            <div data-pdf-section="pricing" style={{ padding: "0 50px 60px 50px" }}>
                <div style={{ marginBottom: "24px", paddingBottom: "16px", borderBottom: `2px solid ${brandColor}` }}>
                    <h2 style={{ margin: 0, fontSize: "20px", color: brandColor, fontWeight: 800, letterSpacing: "-0.5px" }}>Commercials & Schedule</h2>
                </div>
                <div className="table-wrap">
                    <table className="invoice-table">
                        <colgroup>
                            <col style={{ width: '55%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '20%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{isManual ? "Package Cost" : "Itinerary Valuation"} (for {adultPax} Adults{childPax ? `, ${childPax} Children` : ''})</td>
                                <td>1</td>
                                <td>{formatCurrency(costWithMarkup, currency)}</td>
                                <td>{formatCurrency(costWithMarkup, currency)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ background: "rgba(15, 23, 42, 0.02)", border: "1px solid rgba(148,163,184,0.2)", borderTop: "none", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end", borderRadius: "0 0 8px 8px", marginTop: "-40px", marginBottom: "40px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "13px", color: "#475569" }}><span>Subtotal:</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{formatCurrency(costWithMarkup, currency)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "13px", color: "#475569" }}><span>Taxes & Fees:</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{formatCurrency(taxAmount, currency)}</span></div>
                    <div style={{ width: "260px", height: "1px", background: "rgba(148,163,184,0.3)", margin: "4px 0" }}></div>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "16px", color: brandColor, fontWeight: 800 }}><span>Grand Total:</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(finalTotal, currency)}</span></div>
                </div>

                {/* Payment Schedule — full width */}
                <div style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "8px", overflow: "hidden", marginBottom: "24px" }}>
                    <div style={{ background: "rgba(15, 23, 42, 0.04)", padding: "14px 20px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                        <h3 style={{ margin: 0, fontSize: "12px", color: brandColor, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>Payment Schedule</h3>
                    </div>
                    <div className="table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none", margin: 0 }}>
                        <table className="payment-table">
                            <colgroup>
                                <col style={{ width: '40%' }} />
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '20%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Installment</th>
                                    <th>Due Date</th>
                                    <th>Percentage</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(pricing?.milestones?.length > 0 ? pricing.milestones : [{ id: 'fallback', name: 'Full Payment', percentage: 100, dueDate: 'At Booking' }]).map((m: any, i: number) => {
                                    const amount = m.id === 'fallback' ? finalTotal : (finalTotal * m.percentage) / 100;
                                    return (
                                        <tr key={i}>
                                            <td>{m.name}</td>
                                            <td>{m.dueDate}</td>
                                            <td>{m.id === 'fallback' ? '-' : `${m.percentage}%`}</td>
                                            <td>{formatCurrency(amount, currency)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Policies & Methods — below, side by side */}
                <div style={{ display: "flex", gap: "30px" }}>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "8px", overflow: "hidden" }}>
                        <div style={{ background: "rgba(15, 23, 42, 0.04)", padding: "12px 20px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                            <h3 style={{ margin: 0, fontSize: "12px", color: brandColor, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>Terms & Policies</h3>
                        </div>
                        <div style={{ padding: "16px 20px", fontSize: "12px", color: "#475569", lineHeight: "1.6" }}>
                            {cancellationPolicy ? parseList(cancellationPolicy).map((p, i) => <div key={i}>• {p}</div>) : "• Standard cancellation fees apply."}
                        </div>
                    </div>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "8px", overflow: "hidden" }}>
                        <div style={{ background: "rgba(15, 23, 42, 0.04)", padding: "12px 20px", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                            <h3 style={{ margin: 0, fontSize: "12px", color: brandColor, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>Accepted Methods</h3>
                        </div>
                        <div style={{ padding: "16px 20px", fontSize: "12px", color: "#475569", lineHeight: "1.6" }}>
                            {paymentMethods ? parseList(paymentMethods).map((p, i) => <div key={i}>• {p}</div>) : "• Bank Transfer, Credit Card."}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Footer */}
            <div data-pdf-section="footer" style={{ padding: "40px 50px 20px 50px", borderTop: `2px solid ${brandColor}`, background: "white" }}>
                <h2 style={{ fontSize: "16px", color: brandColor, fontWeight: 800, margin: "0 0 24px 0", letterSpacing: "-0.5px" }}>Agency Remittance Details</h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
                    <div style={{ padding: "16px", background: "rgba(248,250,252,0.8)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "6px" }}>
                        <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, marginBottom: "8px" }}>Bank Account</div>
                        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px", color: "#0f172a" }}>{agencySettings?.bankName || 'HDFC Bank'}</div>
                        <div style={{ fontSize: "11px", color: "#475569", marginBottom: "2px" }}>ACC: <span style={{ fontWeight: 600, color: "#0f172a" }}>{agencySettings?.bankAccountNumber || '1234567890'}</span></div>
                        <div style={{ fontSize: "11px", color: "#475569" }}>IFSC: <span style={{ fontWeight: 600, color: "#0f172a" }}>{agencySettings?.bankIfscCode || 'HDFC0001234'}</span></div>
                    </div>
                    <div style={{ padding: "16px", background: "rgba(248,250,252,0.8)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "6px" }}>
                        <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, marginBottom: "8px" }}>Tax Information</div>
                        <div style={{ fontSize: "11px", color: "#475569" }}>GST Number:<br /><span style={{ color: "#0f172a", fontSize: "13px", fontWeight: 700, display: "inline-block", marginTop: "4px" }}>{agencySettings?.gstNumber || '29GGGGG1314R9Z6'}</span></div>
                    </div>
                    <div style={{ padding: "16px", background: "rgba(248,250,252,0.8)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "6px" }}>
                        <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, marginBottom: "8px" }}>UPI Payment</div>
                        <div style={{ fontSize: "11px", color: "#475569" }}>Scan or Pay to:<br /><span style={{ color: "#0f172a", fontSize: "13px", fontWeight: 700, display: "inline-block", marginTop: "4px" }}>{agencySettings?.upiId || 'YOUR-AGENCY@UP9Z6'}</span></div>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(148,163,184,0.2)", paddingTop: "16px" }}>
                    <p style={{ margin: 0, fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Confidential · Prepared for client by {agent.companyName}</p>
                    <p style={{ margin: 0, fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Page generated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};


