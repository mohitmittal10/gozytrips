import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { getThematicBackground, glassStyles } from '../styles';
import { PdfDaywiseIndex } from '../pages';
import { groupHotelsByName, formatHotelStays } from '../shared-blocks';
import { calcPricingFromBaseCost } from '@/services/financial';

const parseList = (text?: string) => {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s !== '-');
};

export const EditorialTheme = ({
    itinerary, title, clientName, agencySettings, agent, hotels = [], flights = [], cabs = [], buses = [], pricing, baseCost = 0, finalTotal = 0, showTimestamps = true, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods, daySummaries, aboutPlace
}: ThemeProps) => {
    const gold = agent.primaryColor || "#b8860b";
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
        <div className="editorial-wrap" style={{ fontFamily: "'Plus Jakarta Sans', 'Georgia', serif", backgroundColor: "#fdfcfa", backgroundImage: `url("${getThematicBackground(itinerary, 'editorial', gold)}")`, backgroundRepeat: "repeat", color: "#2c2c2c", width: "100%" }}>
            <style>
                {`
                .editorial-wrap *, .editorial-wrap *::before, .editorial-wrap *::after { box-sizing: border-box; }

                .editorial-wrap .table-wrap {
                    overflow-x: auto;
                    margin-bottom: 20px;
                }
                .editorial-wrap table { width: 100%; border-collapse: collapse; table-layout: fixed; display: table !important; }
                .editorial-wrap thead { display: table-header-group !important; }
                .editorial-wrap tbody { display: table-row-group !important; }
                .editorial-wrap tr { display: table-row !important; }
                .editorial-wrap th {
                    padding: 16px 20px;
                    font-size: 11px;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-weight: 700;
                    border-bottom: 1px solid rgba(15,23,42,0.1);
                    text-align: left;
                    display: table-cell !important;
                }
                .editorial-wrap th:last-child { text-align: right; }
                .editorial-wrap th:nth-child(2), .editorial-wrap th:nth-child(3) { text-align: center; }
                .editorial-wrap td {
                    padding: 16px 20px;
                    font-size: 14px;
                    color: #334155;
                    font-weight: 500;
                    border-bottom: 1px solid rgba(15,23,42,0.05);
                    vertical-align: middle;
                    display: table-cell !important;
                }
                .editorial-wrap tbody tr:last-child td { border-bottom: none; }
                .editorial-wrap td:first-child { font-weight: 700; color: #1e293b; text-align: left; }
                .editorial-wrap td:nth-child(2), .editorial-wrap td:nth-child(3) { text-align: center; color: #475569; }
                .editorial-wrap td:last-child { text-align: right; font-family: var(--font-mono); font-weight: 700; color: #0f172a; }

                .editorial-wrap .invoice-table th:nth-child(1) { width: 55%; }
                .editorial-wrap .invoice-table th:nth-child(2) { width: 10%; }
                .editorial-wrap .invoice-table th:nth-child(3) { width: 15%; }
                .editorial-wrap .invoice-table th:nth-child(4) { width: 20%; }

                .editorial-wrap .payment-table th:nth-child(1) { width: 40%; }
                .editorial-wrap .payment-table th:nth-child(2) { width: 20%; }
                .editorial-wrap .payment-table th:nth-child(3) { width: 20%; }
                .editorial-wrap .payment-table th:nth-child(4) { width: 20%; }
                `}
            </style>
            {/* Cover */}
            <div data-pdf-section="cover" style={{ paddingBottom: "10px" }}>
                <div style={{ position: "relative", height: "460px", overflow: "hidden" }}>
                    <img src={getCoverImage(itinerary)} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "65%", background: "linear-gradient(to top, rgba(15,23,42,0.9) 10%, rgba(15,23,42,0.3) 60%, transparent)" }} />
                    {/* Agency logo badge — top right (logo only) */}
                    {(agent.logoUrl || agent.companyName) && (
                        <div style={{ position: "absolute", top: "22px", right: "30px", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: "12px", padding: "9px 14px" }}>
                            {agent.logoUrl ? (
                                <img src={agent.logoUrl} alt={agent.companyName} crossOrigin="anonymous" style={{ maxHeight: "32px", maxWidth: "90px", objectFit: "contain", display: "block", filter: "brightness(0) invert(1) opacity(0.95)" }} />
                            ) : (
                                <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "13px" }}>
                                    {(agent.companyName || "T").substring(0, 1).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                    <div style={{ position: "absolute", bottom: "50px", left: "60px", right: "60px", color: "white", zIndex: 1 }}>
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
                            <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 4px 0", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{formatCurrency(calculatedFinalTotal || finalTotal || getTotalBudget(itinerary), (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}</p>
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

            {/* About The Destination */}
            {aboutPlace && (
                <div data-pdf-section="about" style={{ padding: "10px 60px 40px 60px", pageBreakInside: "avoid" }}>
                    <div style={{ display: "flex", gap: "50px", alignItems: "stretch", padding: "40px", background: "rgba(255,255,255,0.4)", borderRadius: "2px", border: "1px solid rgba(184,134,11,0.15)" }}>
                        <div style={{ flex: "0 0 300px", position: "relative" }}>
                            <img src={Array.isArray(itinerary.itinerary) && itinerary.itinerary.length > 0 ? getDayImage(itinerary.itinerary[0]) : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop"} alt="Destination" style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                            <div style={{ position: "absolute", inset: 0, border: `1px solid ${gold}`, mixBlendMode: "overlay" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: "0 0 16px 0", fontSize: "11px", color: gold, textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>About The Destination</h3>
                            <h2 style={{ margin: "0 0 24px 0", fontSize: "32px", color: "#0f172a", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: "normal" }}>{aboutPlace.title}</h2>
                            <p style={{ margin: "0 0 30px 0", color: "#475569", fontSize: "14.5px", lineHeight: "1.9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{aboutPlace.description}</p>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                {(aboutPlace.highlights || []).map((hl: string, i: number) => (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                        <div style={{ flexShrink: 0, width: "4px", height: "4px", borderRadius: "50%", background: gold, marginTop: "8px" }} />
                                        <span style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.6", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{hl}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PdfDaywiseIndex itinerary={itinerary} accentColor={gold} theme="editorial" daySummaries={daySummaries} />

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

                    {(day as any).dailyStats?.totalCost && (
                        <div style={{ display: "flex", gap: "30px", marginTop: "24px", paddingTop: "15px", borderTop: "1px solid #e2e8f0", fontSize: "12px", color: gold, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, pageBreakInside: "avoid" }}>
                            <span>EST. COST FOR THE DAY: {formatCurrency((day as any).dailyStats?.totalCost, (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}</span>
                        </div>
                    )}
                </div>
            ))}

            {/* Travel & Logistics */}
            {(hotels.length > 0 || flights.length > 0 || cabs.length > 0 || buses.length > 0) && (
                <div data-pdf-section="accommodations" style={{ padding: "40px 60px", background: "rgba(253,252,250,0.4)" }}>
                    <h2 style={{ margin: "0 0 40px 0", fontSize: "32px", color: "#0f172a", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: "normal", textAlign: "center" }}>Travel & Logistics</h2>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "30px" }}>
                        {groupHotelsByName(hotels).map((h, i) => (
                            <div key={`hotel-${i}`} style={{ background: "white", padding: "20px", display: "flex", flexDirection: "column", border: "1px solid rgba(184,134,11,0.15)", borderRadius: "2px" }}>
                                <img src={h.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop'} alt={h.name} style={{ width: "100%", height: "200px", objectFit: "cover", marginBottom: "20px" }} crossOrigin="anonymous" />
                                <div style={{ color: gold, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    Hotel • {formatHotelStays(h.stays)}
                                </div>
                                <h4 style={{ margin: "0 0 20px 0", fontSize: "20px", color: "#0f172a", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: "normal" }}>{h.name}</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", borderTop: "1px solid rgba(184,134,11,0.15)", paddingTop: "15px", marginTop: "auto" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Check-in</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{h.checkIn}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Check-out</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{h.checkOut}</span></div>
                                    {h.bookingRef && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Ref</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{h.bookingRef}</span></div>}
                                </div>
                            </div>
                        ))}
                        {flights.map((f, i) => (
                            <div key={`flight-${i}`} style={{ background: "white", padding: "30px", display: "flex", flexDirection: "column", border: "1px solid rgba(184,134,11,0.15)", borderRadius: "2px" }}>
                                <div style={{ color: gold, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Flight • Day {f.dayIndex + 1}</div>
                                <h4 style={{ margin: "0 0 20px 0", fontSize: "20px", color: "#0f172a", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: "normal" }}>{f.airline} {f.flightNumber}</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", borderTop: "1px solid rgba(184,134,11,0.15)", paddingTop: "15px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Route</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{f.departureAirport} → {f.arrivalAirport}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Type</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{f.flightType === 'connecting' ? 'Connecting' : 'Direct'}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Departure / Arrival</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{f.departure} – {f.arrival}</span></div>
                                    {f.layover && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Layover</span><span style={{ fontWeight: 600, color: "#f59e0b" }}>{f.layover}</span></div>}
                                    {f.flightType === 'connecting' && f.connectingDepartureAirport && (
                                        <>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Connecting Route</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{f.connectingDepartureAirport} → {f.connectingArrivalAirport}</span></div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Connecting Flight</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{f.connectingAirline} {f.connectingFlightNumber}</span></div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Connecting Time</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{f.connectingDeparture} – {f.connectingArrival}</span></div>
                                            {f.connectingPnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Connecting PNR</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{f.connectingPnr}</span></div>}
                                        </>
                                    )}
                                    {f.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>PNR</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{f.pnr}</span></div>}
                                </div>
                            </div>
                        ))}
                        {cabs.map((c, i) => (
                            <div key={`cab-${i}`} style={{ background: "white", padding: "30px", display: "flex", flexDirection: "column", border: "1px solid rgba(184,134,11,0.15)", borderRadius: "2px" }}>
                                <div style={{ color: gold, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Transfer • Day {c.dayIndex + 1}</div>
                                <h4 style={{ margin: "0 0 20px 0", fontSize: "20px", color: "#0f172a", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: "normal" }}>{c.vehicleType || "Private Transfer"}</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", borderTop: "1px solid rgba(184,134,11,0.15)", paddingTop: "15px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Route</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{c.route || "Local"}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Pickup</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{c.pickupTime}</span></div>
                                    {c.driverName && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Driver</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{c.driverName}</span></div>}
                                </div>
                            </div>
                        ))}
                        {buses.map((b, i) => (
                            <div key={`bus-${i}`} style={{ background: "white", padding: "30px", display: "flex", flexDirection: "column", border: "1px solid rgba(184,134,11,0.15)", borderRadius: "2px" }}>
                                <div style={{ color: gold, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Bus • Day {b.dayIndex + 1}</div>
                                <h4 style={{ margin: "0 0 20px 0", fontSize: "20px", color: "#0f172a", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: "normal" }}>{b.busType || "Tourist Bus"}</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", borderTop: "1px solid rgba(184,134,11,0.15)", paddingTop: "15px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Route</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{b.route}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Departure</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{b.departureTime}</span></div>
                                    {b.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>PNR</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{b.pnr}</span></div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inclusions & Exclusions */}
            <div data-pdf-section="inclusions" style={{ padding: "40px 60px" }}>
                <div style={{ display: "flex", gap: "40px" }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 24px 0", fontSize: "24px", color: "#0f172a", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: "normal", borderBottom: "1px solid rgba(184,134,11,0.2)", paddingBottom: "15px" }}>Inclusions</h3>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "16px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {inclusionsList.length > 0 ? inclusionsList.map((inc, i) => (
                                <li key={i} style={{ display: "flex", gap: "15px", fontSize: "13.5px", color: "#334155", lineHeight: "1.6" }}><span style={{ color: gold, fontSize: "16px" }}>•</span> <span>{inc}</span></li>
                            )) : <li style={{ fontSize: "13.5px", color: "#64748b" }}>No inclusions specified.</li>}
                        </ul>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 24px 0", fontSize: "24px", color: "#0f172a", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: "normal", borderBottom: "1px solid rgba(15,23,42,0.1)", paddingBottom: "15px" }}>Exclusions</h3>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "16px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {exclusionsList.length > 0 ? exclusionsList.map((exc, i) => (
                                <li key={i} style={{ display: "flex", gap: "15px", fontSize: "13.5px", color: "#475569", lineHeight: "1.6" }}><span style={{ color: "#94a3b8", fontSize: "16px" }}>•</span> <span>{exc}</span></li>
                            )) : <li style={{ fontSize: "13.5px", color: "#64748b" }}>No exclusions specified.</li>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Pricing & Invoice */}
            <div data-pdf-section="pricing" style={{ padding: "40px 60px 80px 60px", background: "rgba(253,252,250,0.4)" }}>
                <h2 style={{ margin: "0 0 40px 0", fontSize: "32px", color: "#0f172a", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: "normal", textAlign: "center" }}>Investment Summary</h2>

                <div style={{ border: "1px solid rgba(184,134,11,0.2)", borderRadius: "2px", background: "white", marginBottom: "50px" }}>
                    <div style={{ padding: "30px" }}>
                        <div className="table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none", margin: 0 }}>
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
                                            <td>{"Curated Journey Cost"} (for {adultPax} Adults{childPax ? `, ${childPax} Children` : ''})</td>
                                            <td>1</td>
                                            <td>{formatCurrency(costWithMarkup, currency)}</td>
                                            <td>{formatCurrency(costWithMarkup, currency)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ borderTop: "1px solid rgba(15,23,42,0.1)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                            {pricing?.manualOptions && pricing.manualOptions.length > 0 ? (
                                <>
                                    <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "14px", color: "#475569" }}><span>Subtotal (Base Cost)</span><span style={{ fontWeight: 600, color: "#1e293b" }}>{formatCurrency(resolvedBaseCost, currency)}</span></div>
                                    {markupAmount > 0 && (
                                        <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "14px", color: "#475569" }}><span>Service Fee / Markup</span><span style={{ fontWeight: 600, color: "#1e293b" }}>+ {formatCurrency(markupAmount, currency)}</span></div>
                                    )}
                                    {taxAmount > 0 && (
                                        <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "14px", color: "#475569" }}><span>Taxes & Fees ({pricing.taxPercentage}%)</span><span style={{ fontWeight: 600, color: "#1e293b" }}>+ {formatCurrency(taxAmount, currency)}</span></div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "14px", color: "#475569" }}><span>Subtotal</span><span style={{ fontWeight: 600, color: "#1e293b" }}>{formatCurrency(costWithMarkup, currency)}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "14px", color: "#475569" }}><span>Taxes & Fees</span><span style={{ fontWeight: 600, color: "#1e293b" }}>{formatCurrency(taxAmount, currency)}</span></div>
                                </>
                            )}
                            <div style={{ width: "260px", height: "1px", background: "rgba(15,23,42,0.1)", margin: "4px 0" }}></div>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "18px", color: gold, fontWeight: 700 }}><span>Total Valuation</span><span>{formatCurrency(calculatedFinalTotal, currency)}</span></div>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "50px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <div style={{ width: "100%" }}>
                        {pricing?.milestones && pricing.milestones.length > 0 && (
                            <>
                                <h3 style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>Payment Terms</h3>
                                <div className="table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none", margin: "0 0 40px 0" }}>
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
                            </>
                        )}

                        {/* Policies & Methods — below, side by side */}
                        <div style={{ display: "flex", gap: "50px" }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: "0 0 15px 0", fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>Payment Methods</h3>
                                <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.7" }}>
                                    {paymentMethods ? parseList(paymentMethods).map((p, i) => <div key={i}>{p}</div>) : "Not specified."}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: "0 0 15px 0", fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>Cancellation Policy</h3>
                                <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.7" }}>
                                    {cancellationPolicy ? parseList(cancellationPolicy).map((p, i) => <div key={i}>{p}</div>) : "Not specified."}
                                </div>
                            </div>
                        </div>
                        {termsAndConditions && (
                            <div style={{ marginTop: "32px", borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: "24px" }}>
                                <h3 style={{ margin: "0 0 15px 0", fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>Terms & Conditions</h3>
                                <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.7" }}>
                                    {parseList(termsAndConditions).map((p, i) => <div key={i}>{p}</div>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div data-pdf-section="footer" style={{ padding: "60px", background: "#0f172a", color: "white", textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {(agencySettings?.bankAccountNumber || agencySettings?.gstNumber || agencySettings?.upiId) && (
                    <>
                        <h2 style={{ fontSize: "24px", color: "white", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: "normal", margin: "0 0 40px 0" }}>Agency Details</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "30px", maxWidth: "800px", margin: "0 auto 50px auto" }}>
                            {agencySettings?.bankAccountNumber && (
                                <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <div style={{ fontSize: "10px", color: gold, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px", fontWeight: 700 }}>Bank Account</div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>{agencySettings?.bankName || ''}</div>
                                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>ACC: {agencySettings?.bankAccountNumber}</div>
                                    {agencySettings?.bankIfscCode && (
                                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>IFSC: {agencySettings?.bankIfscCode}</div>
                                    )}
                                </div>
                            )}
                            {agencySettings?.gstNumber && (
                                <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <div style={{ fontSize: "10px", color: gold, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px", fontWeight: 700 }}>Tax / GST</div>
                                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", letterSpacing: "1px" }}>{agencySettings?.gstNumber}</div>
                                </div>
                            )}
                            {agencySettings?.upiId && (
                                <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <div style={{ fontSize: "10px", color: gold, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px", fontWeight: 700 }}>UPI Payment</div>
                                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", letterSpacing: "1px" }}>{agencySettings?.upiId}</div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "40px", marginBottom: "30px", flexWrap: "wrap", gap: "24px", textAlign: "left" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: "normal", color: gold, margin: "0 0 8px 0", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{agent.companyName}</h2>
                        <p style={{ fontSize: "13px", letterSpacing: "4px", textTransform: "uppercase", color: "white", margin: 0, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Bespoke Travel Solutions</p>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: "4px 0 0 0", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Curated by {agent.agentName}</p>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "rgba(255,255,255,0.7)", textAlign: "right", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {agent.agentPhone && <p style={{ margin: 0 }}>T: <strong style={{ color: "white" }}>{agent.agentPhone}</strong></p>}
                        {agent.agentEmail && <p style={{ margin: 0 }}>E: <strong style={{ color: "white" }}>{agent.agentEmail}</strong></p>}
                        {agent.agentWebsite && <p style={{ margin: 0 }}>W: <strong style={{ color: gold }}>{agent.agentWebsite}</strong></p>}
                    </div>
                </div>
                
                <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px", fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Curated on {new Date().toLocaleDateString()} · Editorial Edition
                </div>
            </div>
        </div>
    );
};

