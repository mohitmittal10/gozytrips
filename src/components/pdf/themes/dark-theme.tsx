import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDistance, formatDate } from '../utils';
import { PdfDaywiseIndex } from '../pages';
import { groupHotelsByName, formatHotelStays } from '../shared-blocks';
import { calcPricingFromBaseCost } from '@/services/financial';

const parseList = (text?: string) => {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s !== '-');
};
function hexToRgb(hex: string): string {
    const s = hex.replace('#', '');
    if (s.length === 3) {
        return `${parseInt(s[0]+s[0], 16)}, ${parseInt(s[1]+s[1], 16)}, ${parseInt(s[2]+s[2], 16)}`;
    }
    if (s.length === 6) {
        return `${parseInt(s.substring(0, 2), 16)}, ${parseInt(s.substring(2, 4), 16)}, ${parseInt(s.substring(4, 6), 16)}`;
    }
    return "168, 85, 247";
}

export const DarkTheme = ({
    itinerary, title, clientName, agencySettings, agent, hotels = [], flights = [], cabs = [], buses = [], pricing, baseCost = 0, finalTotal = 0, showTimestamps = true, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods, daySummaries, aboutPlace
}: ThemeProps) => {
    const accent = agent.primaryColor || "#a855f7";
    const rgbAccent = hexToRgb(accent);
    const totalActivities = Array.isArray(itinerary.itinerary) ? itinerary.itinerary.reduce((sum, d) => sum + (d.timeline?.length || 0), 0) : 0;
    const currency = pricing?.currency || DEFAULT_CURRENCY;
    const adultPax = Number(pricing?.adultPax || 2);
    const childPax = Number(pricing?.childPax || 0);
    const infantPax = Number(pricing?.infantPax || 0);
    const totalPax = adultPax + childPax + infantPax;
    const resolvedBase = baseCost || 0;
    const { baseCost: resolvedBaseCost, markupAmount, costWithMarkup, taxAmount, finalTotal: calculatedFinalTotal } = calcPricingFromBaseCost(resolvedBase, pricing);
    
    const inclusionsList = parseList(inclusions);
    const exclusionsList = parseList(exclusions);
    const paymentMethodsList = parseList(paymentMethods);
    const cancellationPolicyList = parseList(cancellationPolicy);
    const termsAndConditionsList = parseList(termsAndConditions);
    
    return (
        <div className="dark-wrap" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", backgroundColor: "#070a13", color: "#e2e8f0", width: "100%" }}>
            <style>
                {`
                .dark-wrap *, .dark-wrap *::before, .dark-wrap *::after { box-sizing: border-box; }

                .dark-wrap .table-wrap {
                    overflow-x: auto;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.06);
                    background: rgba(255,255,255,0.02);
                    margin-bottom: 40px;
                }
                .dark-wrap table { width: 100%; border-collapse: collapse; table-layout: fixed; display: table !important; }
                .dark-wrap thead { display: table-header-group !important; }
                .dark-wrap tbody { display: table-row-group !important; }
                .dark-wrap tr { display: table-row !important; }
                .dark-wrap th {
                    padding: 14px 20px;
                    font-size: 10px;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-weight: 800;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    text-align: left;
                    display: table-cell !important;
                }
                .dark-wrap th:last-child { text-align: right; }
                .dark-wrap th:nth-child(2), .dark-wrap th:nth-child(3) { text-align: center; }
                .dark-wrap td {
                    padding: 16px 20px;
                    font-size: 14px;
                    color: #cbd5e1;
                    font-weight: 500;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                    vertical-align: middle;
                    display: table-cell !important;
                }
                .dark-wrap tbody tr:last-child td { border-bottom: none; }
                .dark-wrap td:first-child { font-weight: 700; color: #ffffff; text-align: left; }
                .dark-wrap td:nth-child(2), .dark-wrap td:nth-child(3) { text-align: center; color: #94a3b8; }
                .dark-wrap td:last-child { text-align: right; font-family: var(--font-mono); font-weight: 700; color: #ffffff; }

                .dark-wrap .invoice-table th:nth-child(1) { width: 55%; }
                .dark-wrap .invoice-table th:nth-child(2) { width: 10%; }
                .dark-wrap .invoice-table th:nth-child(3) { width: 15%; }
                .dark-wrap .invoice-table th:nth-child(4) { width: 20%; }

                .dark-wrap .payment-table th:nth-child(1) { width: 40%; }
                .dark-wrap .payment-table th:nth-child(2) { width: 20%; }
                .dark-wrap .payment-table th:nth-child(3) { width: 20%; }
                .dark-wrap .payment-table th:nth-child(4) { width: 20%; }
                `}
            </style>

            {/* Cover Section */}
            <div data-pdf-section="cover" style={{ paddingBottom: "10px" }}>
                <div style={{ position: "relative", height: "300px", overflow: "hidden", background: "#0f172a" }}>
                    {getCoverImage(itinerary) ? (
                        <img
                            src={getCoverImage(itinerary)}
                            alt=""
                            style={{ width: "100%", height: "300px", objectFit: "cover", display: "block", filter: "brightness(0.35) saturate(0.7)" }}
                            crossOrigin="anonymous"
                        />
                    ) : null}
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, #070a13 40%, rgba(7,10,19,0.3))` }} />
                    {/* Agency logo badge — top right (logo only) */}
                    {(agent.logoUrl || agent.companyName) && (
                        <div style={{ position: "absolute", top: "22px", right: "30px", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: `1px solid rgba(${rgbAccent}, 0.5)`, borderRadius: "10px", padding: "9px 14px", boxShadow: `0 0 18px rgba(${rgbAccent},0.2), inset 0 1px 0 rgba(255,255,255,0.05)` }}>
                            {agent.logoUrl ? (
                                <img src={agent.logoUrl} alt={agent.companyName} crossOrigin="anonymous" style={{ maxHeight: "32px", maxWidth: "100px", objectFit: "contain", display: "block", filter: `drop-shadow(0 0 4px rgba(${rgbAccent},0.8))` }} />
                            ) : (
                                <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: `rgba(${rgbAccent},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontWeight: 800, fontSize: "13px" }}>
                                    {(agent.companyName || "T").substring(0, 1).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                    <div style={{ position: "absolute", bottom: "40px", left: "45px", right: "45px", zIndex: 1 }}>
                        <h1 style={{ fontSize: "40px", fontWeight: 900, margin: "0 0 8px 0", color: "#ffffff", lineHeight: "1.1", letterSpacing: "-1px", fontFamily: "'Outfit', sans-serif", textShadow: `0 0 20px rgba(${rgbAccent}, 0.3)` }}>{title}</h1>
                        <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, fontWeight: 500 }}>{agent.tagline || `Bespoke Journey designed by ${agent.agentName}`}</p>
                    </div>
                </div>

                {/* Accent bar with Neon glow */}
                <div style={{ height: "3px", background: `linear-gradient(to right, ${accent}, #ec4899, transparent)`, boxShadow: `0 0 8px ${accent}` }} />

                {/* Cover body */}
                <div style={{ padding: "45px" }}>

                    {/* Stat cards */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "40px" }}>
                        {[
                            { label: "Guest / Client", value: clientName || "Valued Guest", sub: `${adultPax} Adults${childPax > 0 ? `, ${childPax} Children` : ''}` },
                            { label: "Duration", value: `${itinerary.itinerary?.length || 0} Days`, sub: `${Math.max((itinerary.itinerary?.length || 0) - 1, 0)} Nights` },
                            { label: "Est. Budget", value: formatCurrency(finalTotal || getTotalBudget(itinerary), (itinerary as any).pricing?.currency || DEFAULT_CURRENCY), sub: "Total Price" },
                            { label: "Activities", value: `${totalActivities}+ Items`, sub: "Scheduled" },
                        ].map((stat, i) => (
                            <div key={i} style={{ flex: "1 1 180px", padding: "18px 20px", border: "1px solid rgba(255,255,255,0.06)", borderTop: `3px solid ${accent}`, background: "rgba(255,255,255,0.02)", borderRadius: "8px", boxShadow: `0 4px 20px rgba(0,0,0,0.15)` }}>
                                <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "2.5px", color: "#64748b", margin: "0 0 4px 0", fontWeight: 800 }}>{stat.label}</p>
                                <p style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 2px 0", color: accent, fontFamily: "'Outfit', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stat.value}</p>
                                <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0, fontWeight: 500 }}>{stat.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Client & Consultant Details grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "30px", paddingTop: "25px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        {/* Client Info Card */}
                        <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.025)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", borderLeft: `3px solid ${accent}` }}>
                            <p style={{ margin: "0 0 12px 0", fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: accent, fontWeight: 800 }}>👤 Client Details</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <div>
                                    <p style={{ margin: "0 0 2px 0", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>Client Name</p>
                                    <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#ffffff", fontFamily: "'Outfit', sans-serif" }}>{clientName || "Valued Guest"}</p>
                                </div>
                                <div style={{ display: "flex", gap: "20px" }}>
                                    <div>
                                        <p style={{ margin: "0 0 2px 0", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>Adults</p>
                                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#cbd5e1" }}>{adultPax} {adultPax === 1 ? 'Adult' : 'Adults'}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 2px 0", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>Children</p>
                                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#cbd5e1" }}>{childPax} {childPax === 1 ? 'Child' : 'Children'}</p>
                                    </div>
                                    {infantPax > 0 && (
                                        <div>
                                            <p style={{ margin: "0 0 2px 0", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>Infants</p>
                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#cbd5e1" }}>{infantPax} {infantPax === 1 ? 'Infant' : 'Infants'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Consultant Info Card */}
                        <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.025)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "3px solid #ec4899" }}>
                            <p style={{ margin: "0 0 12px 0", fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#ec4899", fontWeight: 800 }}>✨ Agency Consultant</p>
                            <p style={{ fontWeight: 800, color: "#ffffff", fontSize: "15px", margin: "0 0 6px 0", fontFamily: "'Outfit', sans-serif" }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ margin: "2px 0", fontSize: "12px", color: "#94a3b8" }}>📞 {agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ margin: "2px 0", fontSize: "12px", color: "#94a3b8" }}>✉️ {agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: accent, fontWeight: 700, textDecoration: "underline" }}>🌐 {agent.agentWebsite}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* About The Destination */}
            {aboutPlace && (
                <div data-pdf-section="about" style={{ padding: "10px 45px 45px 45px" }}>
                    <div style={{ display: "flex", gap: "40px", alignItems: "flex-start", background: "rgba(255,255,255,0.02)", padding: "30px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", boxShadow: `0 4px 20px rgba(0,0,0,0.15)` }}>
                        {Array.isArray(itinerary.itinerary) && itinerary.itinerary.length > 0 && getDayImage(itinerary.itinerary[0]) ? (
                            <div style={{ flex: "0 0 260px" }}>
                                <img src={getDayImage(itinerary.itinerary[0])} alt="Destination" style={{ width: "100%", height: "260px", objectFit: "cover", borderRadius: "6px", display: "block", borderBottom: `3px solid ${accent}` }} crossOrigin="anonymous" />
                            </div>
                        ) : null}
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: "0 0 10px 0", fontSize: "10px", color: accent, textTransform: "uppercase", letterSpacing: "3px", fontWeight: 800 }}>Destination</h3>
                            <h2 style={{ margin: "0 0 20px 0", fontSize: "28px", color: "#ffffff", fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.5px" }}>{aboutPlace.title}</h2>
                            <p style={{ margin: "0 0 24px 0", color: "#94a3b8", fontSize: "14px", lineHeight: "1.8", fontWeight: 500 }}>{aboutPlace.description}</p>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {(aboutPlace.highlights || []).map((hl: string, i: number) => (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.04)" }}>
                                        <div style={{ flexShrink: 0, width: "6px", height: "6px", borderRadius: "50%", background: accent, marginTop: "6px", boxShadow: `0 0 8px ${accent}` }} />
                                        <span style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 600 }}>{hl}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PdfDaywiseIndex itinerary={itinerary} accentColor={agent.primaryColor} theme="dark" daySummaries={daySummaries} />

            {/* Daily itinerary */}
            <div style={{ padding: "0 45px 45px" }}>
                {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => {
                    const dayImg = getDayImage(day);
                    return (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "35px", display: "block" }}>

                        {/* Day header: thumbnail + info panel */}
                        <div style={{ display: "flex", alignItems: "stretch", marginBottom: "14px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", boxShadow: `0 4px 15px rgba(0,0,0,0.1)` }}>
                            {dayImg ? (
                                <img
                                    src={dayImg}
                                    alt={formatTitleCase(day.areaFocus)}
                                    style={{ width: "100px", height: "90px", objectFit: "cover", flexShrink: 0, display: "block", filter: "brightness(0.5) saturate(0.8)" }}
                                    crossOrigin="anonymous"
                                />
                            ) : null}
                            <div style={{ flex: 1, padding: "12px 20px", borderLeft: `3px solid ${accent}`, background: "rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                                    <span style={{ fontSize: "30px", fontWeight: 900, color: accent, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{String(index + 1).padStart(2, '0')}</span>
                                    <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "1px", color: "#ffffff" }}>{formatTitleCase(day.areaFocus)}</h3>
                                </div>
                                <div style={{ display: "flex", gap: "16px", marginTop: "4px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>
                                    {day.date && <span>{formatDate(day.date)}</span>}
                                    {(day as any).dailyStats?.totalCost && (
                                        <span style={{ color: accent }}>{formatCurrency((day as any).dailyStats?.totalCost, (itinerary as any).pricing?.currency || DEFAULT_CURRENCY)}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Activities */}
                        <div style={{ padding: "20px 24px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {Array.isArray(day.timeline) && day.timeline.map((step, si) => (
                                <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: "20px", padding: "12px 16px", borderLeft: `2.5px solid rgba(${rgbAccent}, 0.35)`, borderRadius: "0 8px 8px 0", background: "rgba(255,255,255,0.025)" }}>
                                    {showTimestamps !== false ? (
                                        <span style={{ fontSize: "12px", fontWeight: 800, color: accent, width: "70px", flexShrink: 0, fontFamily: "'Outfit', sans-serif", lineHeight: "1.75" }}>{step.time}</span>
                                    ) : (
                                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: accent, marginTop: "7px", flexShrink: 0 }} />
                                    )}
                                    <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.75", color: "#cbd5e1", flex: 1, fontWeight: 500 }}>{step.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ); })}
            </div>

            {/* Travel & Logistics */}
            {(hotels.length > 0 || flights.length > 0 || cabs.length > 0 || buses.length > 0) && (
                <div data-pdf-section="accommodations" style={{ padding: "0 45px 45px 45px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
                        <h2 style={{ margin: 0, fontSize: "20px", color: "#ffffff", fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Travel & Logistics</h2>
                        <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, rgba(${rgbAccent},0.5), transparent)` }} />
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
                        {groupHotelsByName(hotels).map((h, i) => {
                            const validImages = h.imageUrls ? h.imageUrls.filter(url => url && url.trim().length > 0) : [];
                            const hasPhoto = validImages.length > 0;
                            return (
                                <div key={`hotel-${i}`} style={{ display: "flex", gap: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", borderLeft: !hasPhoto ? `3px solid ${accent}` : undefined }}>
                                    {hasPhoto ? (
                                        <img src={validImages[0]} alt={h.name} style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} crossOrigin="anonymous" />
                                    ) : (
                                        <div style={{ width: "48px", height: "48px", background: `rgba(${rgbAccent},0.12)`, border: `1px solid rgba(${rgbAccent},0.25)`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>🏨</div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" }}>
                                            Hotel • {formatHotelStays(h.stays)}
                                        </div>
                                        <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#ffffff", fontWeight: 700 }}>{h.name}</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", fontSize: "11px", color: "#94a3b8" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>IN</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{h.checkIn}</span></div>
                                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>OUT</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{h.checkOut}</span></div>
                                            {h.bookingRef && <div style={{ display: "flex", justifyContent: "space-between" }}><span>REF</span><span style={{ fontWeight: 600, color: accent }}>{h.bookingRef}</span></div>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {flights.map((f, i) => (
                            <div key={`flight-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                                <div style={{ width: "90px", height: "90px", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", borderRadius: "4px" }}>✈️</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" }}>Flight • Day {f.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#ffffff", fontWeight: 700 }}>{f.airline} {f.flightNumber}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", fontSize: "11px", color: "#94a3b8" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>RTE</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{f.departureAirport} → {f.arrivalAirport}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>TYPE</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{f.flightType === 'connecting' ? 'Connecting' : 'Direct'}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>DEP/ARR</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{f.departure} – {f.arrival}</span></div>
                                        {f.layover && <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>LAY</span><span style={{ fontWeight: 600, color: "#f59e0b" }}>{f.layover}</span></div>}
                                        {f.flightType === 'connecting' && f.connectingDepartureAirport && (
                                            <>
                                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>CONN RTE</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{f.connectingDepartureAirport} → {f.connectingArrivalAirport}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>CONN FLT</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{f.connectingAirline} {f.connectingFlightNumber}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>CONN TIME</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{f.connectingDeparture} – {f.connectingArrival}</span></div>
                                                {f.connectingPnr && <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>CONN PNR</span><span style={{ fontWeight: 600, color: accent }}>{f.connectingPnr}</span></div>}
                                            </>
                                        )}
                                        {f.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span>PNR</span><span style={{ fontWeight: 600, color: accent }}>{f.pnr}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {cabs.map((c, i) => (
                            <div key={`cab-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                                <div style={{ width: "90px", height: "90px", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", borderRadius: "4px" }}>🚕</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" }}>Transfer • Day {c.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#ffffff", fontWeight: 700 }}>{c.vehicleType || "Private Transfer"}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", fontSize: "11px", color: "#94a3b8" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>RTE</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{c.route || "Local"}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>PICK</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{c.pickupTime}</span></div>
                                        {c.driverName && <div style={{ display: "flex", justifyContent: "space-between" }}><span>DRV</span><span style={{ fontWeight: 600, color: accent }}>{c.driverName}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {buses.map((b, i) => (
                            <div key={`bus-${i}`} style={{ display: "flex", gap: "20px", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                                <div style={{ width: "90px", height: "90px", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", borderRadius: "4px" }}>🚌</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: accent, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" }}>Bus • Day {b.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#ffffff", fontWeight: 700 }}>{b.busType || "Tourist Bus"}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", fontSize: "11px", color: "#94a3b8" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>RTE</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{b.route}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}><span>DEP</span><span style={{ fontWeight: 600, color: "#cbd5e1" }}>{b.departureTime}</span></div>
                                        {b.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span>PNR</span><span style={{ fontWeight: 600, color: accent }}>{b.pnr}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inclusions & Exclusions */}
            {(inclusionsList.length > 0 || exclusionsList.length > 0) && (
                <div data-pdf-section="inclusions" style={{ padding: "0 45px 45px 45px" }}>
                    <div style={{ display: "flex", gap: "40px" }}>
                        {inclusionsList.length > 0 && (
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "30px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                                    <div style={{ width: "16px", height: "2px", background: accent, boxShadow: `0 0 8px ${accent}` }} />
                                    <h3 style={{ margin: 0, fontSize: "12px", color: "#ffffff", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800 }}>Inclusions</h3>
                                </div>
                                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {inclusionsList.map((inc, i) => (
                                        <li key={i} style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#cbd5e1", fontWeight: 500 }}><span style={{ color: accent }}>+</span> <span>{inc}</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {exclusionsList.length > 0 && (
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "30px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                                    <div style={{ width: "16px", height: "2px", background: "#64748b" }} />
                                    <h3 style={{ margin: 0, fontSize: "12px", color: "#ffffff", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800 }}>Exclusions</h3>
                                </div>
                                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {exclusionsList.map((exc, i) => (
                                        <li key={i} style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}><span style={{ color: "#64748b" }}>-</span> <span>{exc}</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pricing & Invoice */}
            <div data-pdf-section="pricing" style={{ padding: "0 45px 60px 45px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
                    <h2 style={{ margin: 0, fontSize: "20px", color: "#ffffff", fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Investment Details</h2>
                    <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, rgba(${rgbAccent},0.5), transparent)` }} />
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "30px", marginBottom: "40px" }}>
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
                                        <td>{"Package Cost"} (for {adultPax} Adults{childPax ? `, ${childPax} Children` : ''})</td>
                                        <td>1</td>
                                        <td>{formatCurrency(costWithMarkup, currency)}</td>
                                        <td>{formatCurrency(costWithMarkup, currency)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                        {pricing?.manualOptions && pricing.manualOptions.length > 0 ? (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", width: "320px", fontSize: "13px", color: "#94a3b8" }}><span>Subtotal (Base Cost)</span><span>{formatCurrency(resolvedBaseCost, currency)}</span></div>
                                {markupAmount > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", width: "320px", fontSize: "13px", color: "#94a3b8" }}><span>Service Fee / Markup</span><span>+ {formatCurrency(markupAmount, currency)}</span></div>
                                )}
                                {taxAmount > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", width: "320px", fontSize: "13px", color: "#94a3b8" }}><span>Taxes & Fees ({pricing.taxPercentage}%)</span><span>+ {formatCurrency(taxAmount, currency)}</span></div>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "13px", color: "#94a3b8" }}><span>Subtotal</span><span>{formatCurrency(costWithMarkup, currency)}</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "13px", color: "#94a3b8" }}><span>Taxes & Fees</span><span>{formatCurrency(taxAmount, currency)}</span></div>
                            </>
                        )}
                        <div style={{ width: "320px", height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 0" }}></div>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "320px", fontSize: "18px", color: accent, fontWeight: 800, fontFamily: "var(--font-mono)", textShadow: `0 0 10px rgba(${rgbAccent},0.5)` }}><span>Grand Total</span><span>{formatCurrency(calculatedFinalTotal, currency)}</span></div>
                    </div>
                </div>

                {/* Payment Schedule — full width */}
                {pricing?.milestones && pricing.milestones.length > 0 && (
                    <div style={{ marginBottom: "30px" }}>
                        <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "20px", display: "inline-block", borderBottom: `1px solid ${accent}`, paddingBottom: "4px" }}>Payment Schedule</div>
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
                                            <tr key={m.id || i}>
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
                {(paymentMethodsList.length > 0 || cancellationPolicyList.length > 0) && (
                    <div style={{ display: "flex", gap: "30px" }}>
                        {cancellationPolicyList.length > 0 && (
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "10px" }}>Cancellation Policy</div>
                                <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.7" }}>
                                    {cancellationPolicyList.map((p, i) => <div key={i}>• {p}</div>)}
                                </div>
                            </div>
                        )}
                        {paymentMethodsList.length > 0 && (
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "10px" }}>Payment Methods</div>
                                <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.7" }}>
                                    {paymentMethodsList.map((p, i) => <div key={i}>• {p}</div>)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {termsAndConditionsList.length > 0 && (
                    <div style={{ marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" }}>
                        <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "10px" }}>Terms & Conditions</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.7" }}>
                            {termsAndConditionsList.map((p, i) => <div key={i}>• {p}</div>)}
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Agency Footer */}
            <div data-pdf-section="footer" style={{ padding: "45px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                {(agencySettings?.bankAccountNumber || agencySettings?.gstNumber || agencySettings?.upiId) && (
                    <div style={{ marginBottom: "35px" }}>
                        <h2 style={{ fontSize: "15px", color: "#ffffff", fontFamily: "'Outfit', sans-serif", fontWeight: 800, margin: "0 0 20px 0", letterSpacing: "1px", textTransform: "uppercase" }}>Payment &amp; Tax Information</h2>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                            {agencySettings?.bankAccountNumber && (
                                <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.025)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <div style={{ fontSize: "9px", color: accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "8px" }}>Bank Account</div>
                                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px", color: "#ffffff" }}>{agencySettings?.bankName || 'Bank Details'}</div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>ACC: <span style={{ color: "#cbd5e1" }}>{agencySettings?.bankAccountNumber}</span></div>
                                    {agencySettings?.bankIfscCode && (
                                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>IFSC: <span style={{ color: "#cbd5e1" }}>{agencySettings?.bankIfscCode}</span></div>
                                    )}
                                </div>
                            )}
                            {agencySettings?.gstNumber && (
                                <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.025)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <div style={{ fontSize: "9px", color: accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "8px" }}>Tax Info</div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>GST Number:<br/><span style={{ color: "#ffffff", fontSize: "13px", fontWeight: 700, display: "inline-block", marginTop: "4px" }}>{agencySettings?.gstNumber}</span></div>
                                </div>
                            )}
                            {agencySettings?.upiId && (
                                <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.025)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <div style={{ fontSize: "9px", color: accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 800, marginBottom: "8px" }}>UPI Payment</div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>Pay Direct to:<br/><span style={{ color: "#ffffff", fontSize: "13px", fontWeight: 700, display: "inline-block", marginTop: "4px" }}>{agencySettings?.upiId}</span></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px", marginBottom: "20px", flexWrap: "wrap", gap: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: accent, letterSpacing: "1px", fontFamily: "'Outfit', sans-serif", textShadow: `0 0 10px rgba(${rgbAccent}, 0.5)` }}>{agent.companyName}</div>
                        <p style={{ margin: "4px 0 0 0", color: "#cbd5e1", fontSize: "12px", fontWeight: 700 }}>Bespoke Journey</p>
                        <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "11px" }}>Curated by {agent.agentName}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "#94a3b8", textAlign: "right" }}>
                        {agent.agentPhone && <p style={{ margin: 0 }}>Tel: <strong style={{ color: "#ffffff" }}>{agent.agentPhone}</strong></p>}
                        {agent.agentEmail && <p style={{ margin: 0 }}>Email: <strong style={{ color: "#ffffff" }}>{agent.agentEmail}</strong></p>}
                        {agent.agentWebsite && <p style={{ margin: 0 }}>Web: <strong style={{ color: accent, textShadow: `0 0 8px rgba(${rgbAccent},0.3)` }}>{agent.agentWebsite}</strong></p>}
                    </div>
                </div>
                
                
            </div>
        </div>
    );
};


