import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground } from '../styles';
import { PdfDaywiseIndex } from '../pages';
import { groupHotelsByName, formatHotelStays } from '../shared-blocks';
import { calcPricingFromBaseCost } from '@/services/financial';

const parseList = (text?: string) => {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s !== '-');
};

export const MinimalistTheme = ({
    itinerary, title, clientName, agencySettings, agent, hotels = [], flights = [], cabs = [], buses = [], pricing, baseCost = 0, finalTotal = 0, showTimestamps = true, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods, daySummaries, aboutPlace
}: ThemeProps) => {
    const accent = agent.primaryColor || "#000000";
    const totalActivities = Array.isArray(itinerary.itinerary) ? itinerary.itinerary.reduce((s, d) => s + (d.timeline?.length || 0), 0) : 0;
    const currency = pricing?.currency || DEFAULT_CURRENCY;
    const adultPax = Number(pricing?.adultPax || 2);
    const childPax = Number(pricing?.childPax || 0);
    const infantPax = Number(pricing?.infantPax || 0);
    const totalPax = adultPax + childPax + infantPax;
    const resolvedBase = baseCost || 0;
    const { baseCost: resolvedBaseCost, markupAmount, costWithMarkup, taxAmount, finalTotal: calculatedFinalTotal } = calcPricingFromBaseCost(resolvedBase, pricing);
    
    const inclusionsList = parseList(inclusions);
    const exclusionsList = parseList(exclusions);
    
    return (
        <div className="minimalist-wrap" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", backgroundColor: "#f8fafc", backgroundImage: `url("${getThematicBackground(itinerary, 'minimalist', accent)}")`, backgroundRepeat: "repeat", color: "#0f172a", width: "100%" }}>
            <style>
                {`
                .minimalist-wrap *, .minimalist-wrap *::before, .minimalist-wrap *::after { box-sizing: border-box; }

                .minimalist-wrap .table-wrap {
                    overflow-x: auto;
                    margin-bottom: 20px;
                    background: white;
                }
                .minimalist-wrap table { width: 100%; border-collapse: collapse; table-layout: fixed; display: table !important; }
                .minimalist-wrap thead { display: table-header-group !important; }
                .minimalist-wrap tbody { display: table-row-group !important; }
                .minimalist-wrap tr { display: table-row !important; }
                .minimalist-wrap th {
                    padding: 16px;
                    font-size: 9px;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-weight: 800;
                    border-bottom: 2px solid #0f172a;
                    text-align: left;
                    display: table-cell !important;
                }
                .minimalist-wrap th:last-child { text-align: right; }
                .minimalist-wrap th:nth-child(2), .minimalist-wrap th:nth-child(3) { text-align: center; }
                .minimalist-wrap td {
                    padding: 20px 16px;
                    font-size: 14px;
                    color: #0f172a;
                    font-weight: 500;
                    border-bottom: 1px solid rgba(148,163,184,0.1);
                    vertical-align: middle;
                    display: table-cell !important;
                }
                .minimalist-wrap tbody tr:last-child td { border-bottom: none; }
                .minimalist-wrap td:first-child { font-weight: 700; color: #0f172a; text-align: left; }
                .minimalist-wrap td:nth-child(2), .minimalist-wrap td:nth-child(3) { text-align: center; color: #475569; }
                .minimalist-wrap td:last-child { text-align: right; font-family: var(--font-mono); font-weight: 700; color: #0f172a; }

                .minimalist-wrap .invoice-table th:nth-child(1) { width: 55%; }
                .minimalist-wrap .invoice-table th:nth-child(2) { width: 10%; }
                .minimalist-wrap .invoice-table th:nth-child(3) { width: 15%; }
                .minimalist-wrap .invoice-table th:nth-child(4) { width: 20%; }

                .minimalist-wrap .payment-table th:nth-child(1) { width: 40%; }
                .minimalist-wrap .payment-table th:nth-child(2) { width: 20%; }
                .minimalist-wrap .payment-table th:nth-child(3) { width: 20%; }
                .minimalist-wrap .payment-table th:nth-child(4) { width: 20%; }
                `}
            </style>

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
                    {/* Agency logo badge — top right (logo only) */}
                    {(agent.logoUrl || agent.companyName) && (
                        <div style={{ position: "absolute", top: "22px", right: "30px", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "9px 14px" }}>
                            {agent.logoUrl ? (
                                <img src={agent.logoUrl} alt={agent.companyName} crossOrigin="anonymous" style={{ maxHeight: "28px", maxWidth: "80px", objectFit: "contain", display: "block", filter: "brightness(0) invert(1) opacity(0.9)" }} />
                            ) : (
                                <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "12px" }}>
                                    {(agent.companyName || "T").substring(0, 1).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                    <div style={{ position: "absolute", bottom: "35px", left: "45px", right: "45px", color: "#fff" }}>
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
                            { label: "Est. Budget", value: formatCurrency(calculatedFinalTotal || finalTotal || getTotalBudget(itinerary), (itinerary as any).pricing?.currency || DEFAULT_CURRENCY) },
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

            {/* About The Destination */}
            {aboutPlace && (
                <div data-pdf-section="about" style={{ padding: "0 45px 45px 45px", pageBreakInside: "avoid" }}>
                    <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
                        <div style={{ flex: "0 0 240px" }}>
                            <img src={Array.isArray(itinerary.itinerary) && itinerary.itinerary.length > 0 ? getDayImage(itinerary.itinerary[0]) : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop"} alt="Destination" style={{ width: "100%", height: "300px", objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: "0 0 10px 0", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700 }}>About Destination</h3>
                            <h2 style={{ margin: "0 0 20px 0", fontSize: "32px", color: "#0f172a", fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-1px" }}>{aboutPlace.title}</h2>
                            <p style={{ margin: "0 0 30px 0", color: "#334155", fontSize: "14px", lineHeight: "1.8", fontWeight: 500 }}>{aboutPlace.description}</p>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {(aboutPlace.highlights || []).map((hl: string, i: number) => (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", borderBottom: "1px solid rgba(148,163,184,0.2)", paddingBottom: "12px" }}>
                                        <div style={{ flexShrink: 0, width: "16px", height: "16px", borderRadius: "50%", border: `1.5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px" }}>
                                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: accent }} />
                                        </div>
                                        <span style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600 }}>{hl}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                    {(day as any).dailyStats?.totalCost && (
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

            {/* Travel & Logistics */}
            {(hotels.length > 0 || flights.length > 0 || cabs.length > 0 || buses.length > 0) && (
                <div data-pdf-section="accommodations" style={{ padding: "0 45px 45px 45px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
                        <h2 style={{ margin: 0, fontSize: "14px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "3px", fontWeight: 800 }}>Travel & Logistics</h2>
                        <div style={{ flex: 1, height: "1px", background: "rgba(148,163,184,0.3)" }} />
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
                        {groupHotelsByName(hotels).map((h, i) => (
                            <div key={`hotel-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(148,163,184,0.2)", padding: "16px", background: "white" }}>
                                <img src={h.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop'} alt={h.name} style={{ width: "80px", height: "80px", objectFit: "cover" }} crossOrigin="anonymous" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
                                        Hotel • {formatHotelStays(h.stays)}
                                    </div>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#0f172a", fontWeight: 700 }}>{h.name}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px", fontSize: "11px", color: "#475569" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>IN</span><span style={{ fontWeight: 600 }}>{h.checkIn}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>OUT</span><span style={{ fontWeight: 600 }}>{h.checkOut}</span></div>
                                        {h.bookingRef && <div style={{ display: "flex", justifyContent: "space-between" }}><span>REF</span><span style={{ fontWeight: 600 }}>{h.bookingRef}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {flights.map((f, i) => (
                            <div key={`flight-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(148,163,184,0.2)", padding: "16px", background: "white" }}>
                                <div style={{ width: "80px", height: "80px", background: "rgba(15,23,42,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>✈️</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>Flight • Day {f.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#0f172a", fontWeight: 700 }}>{f.airline} {f.flightNumber}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px", fontSize: "11px", color: "#475569" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>RTE</span><span style={{ fontWeight: 600 }}>{f.departureAirport} → {f.arrivalAirport}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>TYPE</span><span style={{ fontWeight: 600 }}>{f.flightType === 'connecting' ? 'Connecting' : 'Direct'}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>DEP/ARR</span><span style={{ fontWeight: 600 }}>{f.departure} – {f.arrival}</span></div>
                                        {f.layover && <div style={{ display: "flex", justifyContent: "space-between" }}><span>LAY</span><span style={{ fontWeight: 600, color: "#f59e0b" }}>{f.layover}</span></div>}
                                        {f.flightType === 'connecting' && f.connectingDepartureAirport && (
                                            <>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span>CONN RTE</span><span style={{ fontWeight: 600 }}>{f.connectingDepartureAirport} → {f.connectingArrivalAirport}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span>CONN FLT</span><span style={{ fontWeight: 600 }}>{f.connectingAirline} {f.connectingFlightNumber}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span>CONN TIME</span><span style={{ fontWeight: 600 }}>{f.connectingDeparture} – {f.connectingArrival}</span></div>
                                                {f.connectingPnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span>CONN PNR</span><span style={{ fontWeight: 600 }}>{f.connectingPnr}</span></div>}
                                            </>
                                        )}
                                        {f.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span>PNR</span><span style={{ fontWeight: 600 }}>{f.pnr}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {cabs.map((c, i) => (
                            <div key={`cab-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(148,163,184,0.2)", padding: "16px", background: "white" }}>
                                <div style={{ width: "80px", height: "80px", background: "rgba(15,23,42,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🚕</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>Transfer • Day {c.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#0f172a", fontWeight: 700 }}>{c.vehicleType || "Private Transfer"}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px", fontSize: "11px", color: "#475569" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>RTE</span><span style={{ fontWeight: 600 }}>{c.route || "Local"}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>PICK</span><span style={{ fontWeight: 600 }}>{c.pickupTime}</span></div>
                                        {c.driverName && <div style={{ display: "flex", justifyContent: "space-between" }}><span>DRV</span><span style={{ fontWeight: 600 }}>{c.driverName}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {buses.map((b, i) => (
                            <div key={`bus-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(148,163,184,0.2)", padding: "16px", background: "white" }}>
                                <div style={{ width: "80px", height: "80px", background: "rgba(15,23,42,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🚌</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>Bus • Day {b.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#0f172a", fontWeight: 700 }}>{b.busType || "Tourist Bus"}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px", fontSize: "11px", color: "#475569" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>RTE</span><span style={{ fontWeight: 600 }}>{b.route}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>DEP</span><span style={{ fontWeight: 600 }}>{b.departureTime}</span></div>
                                        {b.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span>PNR</span><span style={{ fontWeight: 600 }}>{b.pnr}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inclusions & Exclusions */}
            <div data-pdf-section="inclusions" style={{ padding: "0 45px 45px 45px" }}>
                <div style={{ display: "flex", gap: "40px" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                            <div style={{ width: "16px", height: "2px", background: accent }} />
                            <h3 style={{ margin: 0, fontSize: "12px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800 }}>Inclusions</h3>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {inclusionsList.length > 0 ? inclusionsList.map((inc, i) => (
                                <li key={i} style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#334155", fontWeight: 500 }}><span style={{ color: accent }}>+</span> <span>{inc}</span></li>
                            )) : <li style={{ fontSize: "13px", color: "#64748b" }}>No inclusions specified.</li>}
                        </ul>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                            <div style={{ width: "16px", height: "2px", background: "#94a3b8" }} />
                            <h3 style={{ margin: 0, fontSize: "12px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800 }}>Exclusions</h3>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {exclusionsList.length > 0 ? exclusionsList.map((exc, i) => (
                                <li key={i} style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#475569", fontWeight: 500 }}><span style={{ color: "#94a3b8" }}>-</span> <span>{exc}</span></li>
                            )) : <li style={{ fontSize: "13px", color: "#64748b" }}>No exclusions specified.</li>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Pricing & Invoice */}
            <div data-pdf-section="pricing" style={{ padding: "0 45px 60px 45px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
                    <h2 style={{ margin: 0, fontSize: "14px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "3px", fontWeight: 800 }}>Invoice & Schedule</h2>
                    <div style={{ flex: 1, height: "1px", background: "rgba(148,163,184,0.3)" }} />
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
                            {pricing?.manualOptions && pricing.manualOptions.length > 0 ? (
                                pricing.manualOptions.map((item: any, idx: number) => {
                                    const qty = item.type === 'per-person' ? totalPax : 1;
                                    const rate = Number(item.amount) || 0;
                                    const amount = qty * rate;
                                    return (
                                        <tr key={item.id || idx}>
                                            <td>{item.name} {item.type === 'per-person' ? `(Per Person)` : ''}</td>
                                            <td>{qty}</td>
                                            <td>{formatCurrency(rate, currency)}</td>
                                            <td>{formatCurrency(amount, currency)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td>{"Package Cost"} (for {adultPax} Adults{childPax ? `, ${childPax} Children` : ''})</td>
                                    <td>1</td>
                                    <td>{formatCurrency(costWithMarkup, currency)}</td>
                                    <td>{formatCurrency(costWithMarkup, currency)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ background: "white", borderTop: "1px solid rgba(148,163,184,0.2)", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", marginBottom: "40px" }}>
                    {pricing?.manualOptions && pricing.manualOptions.length > 0 ? (
                        <>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "12px", color: "#475569" }}><span>Subtotal (Base Cost)</span><span>{formatCurrency(resolvedBaseCost, currency)}</span></div>
                            {markupAmount > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "12px", color: "#475569", marginTop: "4px" }}><span>Service Fee / Markup</span><span>+ {formatCurrency(markupAmount, currency)}</span></div>
                            )}
                            {taxAmount > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "12px", color: "#475569", marginTop: "4px" }}><span>Taxes & Fees ({pricing.taxPercentage}%)</span><span>+ {formatCurrency(taxAmount, currency)}</span></div>
                            )}
                        </>
                    ) : (
                        <>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "12px", color: "#475569" }}><span>Subtotal</span><span>{formatCurrency(costWithMarkup, currency)}</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "12px", color: "#475569", marginTop: "4px" }}><span>Taxes & Fees</span><span>{formatCurrency(taxAmount, currency)}</span></div>
                        </>
                    )}
                    <div style={{ width: "260px", height: "1px", background: "rgba(148,163,184,0.2)", margin: "6px 0" }}></div>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "18px", color: accent, fontWeight: 800, fontFamily: "var(--font-mono)" }}><span>Grand Total</span><span>{formatCurrency(calculatedFinalTotal, currency)}</span></div>
                </div>

                {/* Payment Schedule — full width */}
                {pricing?.milestones && pricing.milestones.length > 0 && (
                    <div style={{ marginBottom: "30px" }}>
                        <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "16px" }}>Payment Schedule</div>
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
                                    {pricing.milestones.map((m: any, i: number) => {
                                        const amount = (calculatedFinalTotal * m.percentage) / 100;
                                        return (
                                            <tr key={i}>
                                                <td>{m.name}</td>
                                                <td>{m.dueDate}</td>
                                                <td>{m.percentage}%</td>
                                                <td>{formatCurrency(amount, currency)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Policies & Methods — below, side by side */}
                <div style={{ display: "flex", gap: "40px" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "8px" }}>Cancellation Policy</div>
                        <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.6" }}>
                            {cancellationPolicy ? parseList(cancellationPolicy).map((p, i) => <div key={i}>- {p}</div>) : "Not specified."}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "8px" }}>Payment Methods</div>
                        <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.6" }}>
                            {paymentMethods ? parseList(paymentMethods).map((p, i) => <div key={i}>- {p}</div>) : "Not specified."}
                        </div>
                    </div>
                </div>
                {termsAndConditions && (
                    <div style={{ marginTop: "24px", borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: "20px" }}>
                        <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "8px" }}>Terms & Conditions</div>
                        <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.6" }}>
                            {parseList(termsAndConditions).map((p, i) => <div key={i}>- {p}</div>)}
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Footer */}
            <div data-pdf-section="footer" style={{ padding: "40px 45px", borderTop: "2px solid #0f172a", background: "#0f172a", color: "white" }}>
                {(agencySettings?.bankAccountNumber || agencySettings?.gstNumber || agencySettings?.upiId) && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                        {agencySettings?.bankAccountNumber && (
                            <div>
                                <div style={{ fontSize: "9px", color: accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "12px" }}>Bank Account</div>
                                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>{agencySettings?.bankName || ''}</div>
                                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>ACC: {agencySettings?.bankAccountNumber}</div>
                                {agencySettings?.bankIfscCode && (
                                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>IFSC: {agencySettings?.bankIfscCode}</div>
                                )}
                            </div>
                        )}
                        {agencySettings?.gstNumber && (
                            <div>
                                <div style={{ fontSize: "9px", color: accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "12px" }}>Tax Information</div>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>GST: {agencySettings?.gstNumber}</div>
                            </div>
                        )}
                        {agencySettings?.upiId && (
                            <div>
                                <div style={{ fontSize: "9px", color: accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "12px" }}>UPI Payment</div>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{agencySettings?.upiId}</div>
                            </div>
                        )}
                    </div>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "30px", marginBottom: "20px", flexWrap: "wrap", gap: "24px", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "white", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>{agent.companyName}</span>
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Curated by {agent.agentName}</span>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "right" }}>
                        {agent.agentPhone && <span style={{ fontSize: "11px" }}>T: {agent.agentPhone}</span>}
                        {agent.agentEmail && <span style={{ fontSize: "11px" }}>E: {agent.agentEmail}</span>}
                        {agent.agentWebsite && <span style={{ fontSize: "11px", color: "white", fontWeight: 600 }}>W: {agent.agentWebsite}</span>}
                    </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                    <span>Prepared by {agent.companyName}</span>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};


