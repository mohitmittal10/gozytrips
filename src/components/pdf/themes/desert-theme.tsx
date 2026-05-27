import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDate } from '../utils';
import { PdfDaywiseIndex } from '../pages';
import { calcPricingFromBaseCost } from '@/services/financial';

const parseList = (text?: string) => {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s !== '-');
};

const PAGE_STYLE: React.CSSProperties = {
    minHeight: "1120px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    pageBreakAfter: "always",
    breakAfter: "page",
};

const getPrimaryDestination = (itinerary: ThemeProps["itinerary"]) =>
    itinerary.itinerary?.[0]?.areaFocus?.split(',')[0]?.trim() || "Destination";

const getHeroDescription = (itinerary: ThemeProps["itinerary"]) =>
    itinerary.itinerary?.[0]?.timeline?.[0]?.details || itinerary.optimizations?.[0]?.message || "A curated luxury journey designed around your destination.";

const getNightsLabel = (days: number) => `${Math.max(days - 1, 0)} Night${Math.max(days - 1, 0) === 1 ? "" : "s"}`;

const getAgencyDetails = (agent: ThemeProps["agent"]) => {
    const details = [
        agent.agentName,
        agent.agentPhone,
        agent.agentEmail,
        agent.agentWebsite,
    ].filter(Boolean);

    return details;
};

const getAgencyNarrative = (agent: ThemeProps["agent"]) =>
    agent.agentBio || "Available to curate, confirm, and coordinate every element of your journey.";

export const DesertFooter = ({ agent, agencySettings }: { agent: ThemeProps["agent"], agencySettings?: any }) => (
    <section
        data-pdf-section="footer"
        style={{
            ...PAGE_STYLE,
            justifyContent: "flex-end",
            background: "#ffffff",
            padding: "72px 64px",
            pageBreakAfter: "auto",
            breakAfter: "auto",
        }}
    >
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: "920px", background: "#e6d5c3", borderRadius: "24px", padding: "56px 48px", textAlign: "center", boxShadow: "0 18px 45px rgba(17,24,39,0.08)" }}>
                <div style={{ width: "64px", height: "64px", margin: "0 auto 28px auto", borderRadius: "999px", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", color: "#433429", fontSize: "24px", fontWeight: 700 }}>
                    CT
                </div>
                <h2 style={{ margin: "0 0 14px 0", fontSize: "36px", color: "#433429", fontWeight: 500 }}>
                    Contact {agent.companyName}
                </h2>
                <p style={{ margin: "0 auto 34px auto", maxWidth: "540px", fontSize: "16px", lineHeight: "1.9", color: "rgba(67,52,41,0.72)", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                    {getAgencyNarrative(agent)}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", color: "#433429", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                    {agent.agentPhone && <p style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>{agent.agentPhone}</p>}
                    {agent.agentEmail && <p style={{ margin: 0, fontSize: "16px", color: "rgba(67,52,41,0.7)" }}>{agent.agentEmail}</p>}
                    {agent.agentWebsite && <p style={{ margin: 0, fontSize: "16px", color: "rgba(67,52,41,0.7)" }}>{agent.agentWebsite}</p>}
                    {!agent.agentPhone && !agent.agentEmail && !agent.agentWebsite && <p style={{ margin: 0, fontSize: "16px", color: "rgba(67,52,41,0.7)" }}>Contact details will appear here from your profile settings.</p>}
                </div>
                
                <div style={{ marginTop: "40px", paddingTop: "40px", borderTop: "1px solid rgba(67,52,41,0.15)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", textAlign: "left", color: "#433429", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                    <div>
                        <p style={{ margin: "0 0 10px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(67,52,41,0.6)", fontWeight: 700 }}>Bank Account</p>
                        <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 700 }}>{agencySettings?.bankName || 'HDFC Bank'}</p>
                        <p style={{ margin: "0 0 2px 0", fontSize: "12px", color: "rgba(67,52,41,0.8)" }}>ACC: <span style={{ fontWeight: 600 }}>{agencySettings?.bankAccountNumber || '1234567890'}</span></p>
                        <p style={{ margin: 0, fontSize: "12px", color: "rgba(67,52,41,0.8)" }}>IFSC: <span style={{ fontWeight: 600 }}>{agencySettings?.bankIfscCode || 'HDFC0001234'}</span></p>
                    </div>
                    <div>
                        <p style={{ margin: "0 0 10px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(67,52,41,0.6)", fontWeight: 700 }}>Tax Information</p>
                        <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "rgba(67,52,41,0.8)" }}>GST Number:</p>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{agencySettings?.gstNumber || '29GGGGG1314R9Z6'}</p>
                    </div>
                    <div>
                        <p style={{ margin: "0 0 10px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(67,52,41,0.6)", fontWeight: 700 }}>UPI Payment</p>
                        <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "rgba(67,52,41,0.8)" }}>Scan or Pay to:</p>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{agencySettings?.upiId || 'YOUR-AGENCY@UP9Z6'}</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export const DesertTheme = ({
    itinerary, title, clientName, agencySettings, agent, hotels = [], flights = [], cabs = [], buses = [], pricing, baseCost = 0, finalTotal = 0, showTimestamps = true, showPrices = true, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods, daySummaries, aboutPlace
}: ThemeProps) => {
    const days = itinerary.itinerary?.length || 0;
    const nights = getNightsLabel(days);
    const currency = (itinerary as any).pricing?.currency || DEFAULT_CURRENCY;
    const totalBudget = formatCurrency(finalTotal || getTotalBudget(itinerary), currency);
    const destination = getPrimaryDestination(itinerary);
    const heroDescription = getHeroDescription(itinerary);
    const agencyDetails = getAgencyDetails(agent);
    
    const isManual = pricing?.costingType === 'manual';
    const adultPax = Number(pricing?.adultPax || 2);
    const childPax = Number(pricing?.childPax || 0);
    const resolvedBase = baseCost || 0;
    const { costWithMarkup, taxAmount } = calcPricingFromBaseCost(resolvedBase, pricing);
    
    const inclusionsList = parseList(inclusions);
    const exclusionsList = parseList(exclusions);

    return (
        <div className="desert-wrap" style={{ fontFamily: "'Noto Serif', 'Georgia', serif", backgroundColor: "#fdfcfb", color: "#131314", width: "100%" }}>
            <style>
                {`
                .desert-wrap *, .desert-wrap *::before, .desert-wrap *::after { box-sizing: border-box; }

                .desert-wrap .table-wrap {
                    overflow-x: auto;
                    border-radius: 16px;
                    border: 1px solid #f3e8d8;
                    background: #fdfcfb;
                    margin-bottom: 60px;
                }
                .desert-wrap table { width: 100%; border-collapse: collapse; table-layout: fixed; display: table !important; }
                .desert-wrap thead { background: #fcfaf7; border-bottom: 1px solid #f3e8d8; display: table-header-group !important; }
                .desert-wrap tbody { display: table-row-group !important; }
                .desert-wrap tr { display: table-row !important; }
                .desert-wrap th {
                    padding: 24px 32px;
                    font-size: 12px;
                    color: #9ca3af;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-weight: 700;
                    border-bottom: 1px solid #f3e8d8;
                    text-align: left;
                    display: table-cell !important;
                }
                .desert-wrap th:last-child { text-align: right; }
                .desert-wrap th:nth-child(2), .desert-wrap th:nth-child(3) { text-align: center; }
                .desert-wrap td {
                    padding: 24px 32px;
                    font-size: 15px;
                    color: #374151;
                    font-weight: 500;
                    border-bottom: 1px solid #f3e8d8;
                    vertical-align: middle;
                    display: table-cell !important;
                }
                .desert-wrap tbody tr:last-child td { border-bottom: none; }
                .desert-wrap td:first-child { font-weight: 700; color: #1f2937; text-align: left; }
                .desert-wrap td:nth-child(2), .desert-wrap td:nth-child(3) { text-align: center; color: #6b7280; }
                .desert-wrap td:last-child { text-align: right; font-family: var(--font-mono); font-weight: 700; color: #111827; }

                .desert-wrap .invoice-table th:nth-child(1) { width: 55%; }
                .desert-wrap .invoice-table th:nth-child(2) { width: 10%; }
                .desert-wrap .invoice-table th:nth-child(3) { width: 15%; }
                .desert-wrap .invoice-table th:nth-child(4) { width: 20%; }

                .desert-wrap .payment-table th:nth-child(1) { width: 40%; }
                .desert-wrap .payment-table th:nth-child(2) { width: 20%; }
                .desert-wrap .payment-table th:nth-child(3) { width: 20%; }
                .desert-wrap .payment-table th:nth-child(4) { width: 20%; }
                `}
            </style>
            <section data-pdf-section="cover" style={{ ...PAGE_STYLE, background: "#fdfcfb" }}>
                <div style={{ position: "relative", height: "620px", overflow: "hidden" }}>
                    <img src={getCoverImage(itinerary)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 55%)" }} />
                    <div style={{ position: "absolute", left: "64px", right: "64px", bottom: "72px", color: "#ffffff" }}>
                        <h1 style={{ margin: "0 0 24px 0", fontSize: "64px", lineHeight: "0.98", fontWeight: 500, letterSpacing: "-0.8px" }}>
                            {title}
                        </h1>
                        <p style={{ margin: 0, maxWidth: "760px", fontSize: "21px", lineHeight: "1.7", color: "rgba(255,255,255,0.92)", fontWeight: 400 }}>
                            {heroDescription}
                        </p>
                    </div>
                </div>

                <div data-pdf-section="quick-stats" style={{ background: "#ffffff", borderBottom: "1px solid #f3f4f6", padding: "42px 64px", marginTop: "auto" }}>
                    <div style={{ display: "flex", gap: "24px" }}>
                        {[
                            { label: "Duration", value: `${days} Days / ${nights}` },
                            { label: "Total Budget", value: totalBudget },
                            { label: "Location", value: destination },
                        ].map((item, index) => (
                            <div key={index} style={{ flex: 1, display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "999px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c", fontSize: "18px", fontWeight: 700 }}>
                                    {index === 0 ? "D" : index === 1 ? "$" : "L"}
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 4px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "#9ca3af", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                        {item.label}
                                    </p>
                                    <p style={{ margin: 0, fontSize: "16px", color: "#1f2937", fontWeight: 600, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section data-pdf-section="agency-details" style={{ ...PAGE_STYLE, background: "#ffffff", padding: "88px 64px 72px 64px" }}>
                <div style={{ maxWidth: "960px" }}>
                    <p style={{ margin: "0 0 16px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "3px", color: "#fb923c", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                        Your Travel Agency
                    </p>
                    <h2 style={{ margin: "0 0 28px 0", fontSize: "52px", lineHeight: "1.08", color: "#111827", fontWeight: 500 }}>
                        {agent.companyName}
                    </h2>
                    <p style={{ margin: "0 0 28px 0", fontSize: "17px", lineHeight: "1.9", color: "#6b7280", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                        {getAgencyNarrative(agent)}
                    </p>

                    <div style={{ background: "#fcfaf7", border: "1px solid #f3e8d8", borderRadius: "22px", padding: "32px 34px" }}>
                        <p style={{ margin: "0 0 18px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "3px", color: "#9ca3af", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                            Agency Details
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: "28px", rowGap: "18px" }}>
                            {agencyDetails.length > 0 ? agencyDetails.map((detail, index) => (
                                <div key={index} style={{ paddingBottom: "12px", borderBottom: "1px solid #efe5d8" }}>
                                    <p style={{ margin: "0 0 6px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "#b48b63", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                        {index === 0 ? "Consultant" : index === 1 ? "Phone" : index === 2 ? "Email" : "Website"}
                                    </p>
                                    <p style={{ margin: 0, fontSize: "16px", lineHeight: "1.7", color: "#433429", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                        {detail}
                                    </p>
                                </div>
                            )) : (
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <p style={{ margin: 0, fontSize: "16px", lineHeight: "1.8", color: "#6b7280", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                        Agency contact details will appear here once your business profile is completed.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* About The Destination */}
            {aboutPlace && (
                <section data-pdf-section="about" style={{ padding: "88px 64px", background: "#fcfaf7" }}>
                    <div style={{ display: "flex", gap: "50px", alignItems: "flex-start", maxWidth: "1000px", margin: "0 auto" }}>
                        <div style={{ flex: "0 0 350px", position: "relative" }}>
                            <div style={{ position: "absolute", top: "-15px", left: "-15px", width: "100%", height: "100%", border: "2px solid #e6d5c3", borderRadius: "16px" }} />
                            <img src={Array.isArray(itinerary.itinerary) && itinerary.itinerary.length > 0 ? getDayImage(itinerary.itinerary[0]) : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop"} alt="Destination" style={{ position: "relative", width: "100%", height: "450px", objectFit: "cover", borderRadius: "16px", display: "block", zIndex: 1, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }} crossOrigin="anonymous" />
                        </div>
                        <div style={{ flex: 1, paddingTop: "20px" }}>
                            <p style={{ margin: "0 0 16px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "4px", color: "#b48b63", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>About The Destination</p>
                            <h2 style={{ margin: "0 0 24px 0", fontSize: "40px", color: "#111827", fontWeight: 500, lineHeight: "1.1" }}>{aboutPlace.title}</h2>
                            <p style={{ margin: "0 0 32px 0", color: "#4b5563", fontSize: "16px", lineHeight: "1.9", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{aboutPlace.description}</p>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                {(aboutPlace.highlights || []).map((hl: string, i: number) => (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                                        <div style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%", background: "#f3e8d8", display: "flex", alignItems: "center", justifyContent: "center", color: "#b48b63", fontSize: "12px", marginTop: "4px" }}>✦</div>
                                        <span style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500, lineHeight: "1.6", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{hl}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section style={{ ...PAGE_STYLE, background: "#433429" }}>
                <PdfDaywiseIndex itinerary={itinerary} accentColor={agent.primaryColor} theme="desert" daySummaries={daySummaries} />
            </section>

            <section data-pdf-section="journey" style={{ padding: "88px 64px", background: "#fafafa" }}>
                <div style={{ textAlign: "center", marginBottom: "72px", pageBreakInside: "avoid", breakInside: "avoid" }}>
                    <p style={{ margin: "0 0 16px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "4px", color: "#9ca3af", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                        Your Journey
                    </p>
                    <h2 style={{ margin: 0, fontSize: "44px", color: "#111827", fontWeight: 500 }}>
                        Curated Experiences
                    </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
                    {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day, index) => (
                        <article key={index} data-pdf-section={`day-${index}`} style={{ display: "flex", gap: "40px", alignItems: "center", pageBreakInside: "avoid", breakInside: "avoid", flexDirection: index % 2 === 0 ? "row" : "row-reverse" }}>
                            <div style={{ flex: "0 0 32%", overflow: "hidden", borderRadius: "8px" }}>
                                <img src={getDayImage(day)} alt={formatTitleCase(day.areaFocus)} style={{ width: "100%", height: "256px", objectFit: "cover", display: "block" }} crossOrigin="anonymous" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: "0 0 8px 0", color: "#fb923c", fontSize: "14px", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                    Day {index + 1}
                                </p>
                                <h3 style={{ margin: "0 0 8px 0", fontSize: "30px", color: "#1f2937", fontWeight: 500 }}>
                                    {formatTitleCase(day.areaFocus)}
                                </h3>
                                <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                    {day.timeline?.[0]?.time && day.timeline?.[day.timeline.length - 1]?.time
                                        ? `${day.timeline[0].time} - ${day.timeline[day.timeline.length - 1].time}`
                                        : formatDate(day.date) || "Full Day"}
                                </p>
                                <p style={{ margin: 0, fontSize: "16px", lineHeight: "1.9", color: "#6b7280", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                    {day.timeline?.map(step => step.details).join(" ") || formatDate(day.date)}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* Travel & Logistics */}
            {(hotels.length > 0 || flights.length > 0 || cabs.length > 0 || buses.length > 0) && (
                <section data-pdf-section="accommodations" style={{ padding: "88px 64px", background: "#fdfcfb" }}>
                    <div style={{ textAlign: "center", marginBottom: "60px", pageBreakInside: "avoid", breakInside: "avoid" }}>
                        <p style={{ margin: "0 0 16px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "4px", color: "#b48b63", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>Logistics</p>
                        <h2 style={{ margin: 0, fontSize: "40px", color: "#111827", fontWeight: 500 }}>Travel & Accommodations</h2>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "40px", maxWidth: "1000px", margin: "0 auto" }}>
                        {hotels.map((h, i) => (
                            <div key={`hotel-${i}`} style={{ display: "flex", gap: "24px", background: "#ffffff", border: "1px solid #f3e8d8", padding: "24px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                                <div style={{ flexShrink: 0 }}>
                                    <img src={h.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop'} alt={h.name} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} crossOrigin="anonymous" />
                                </div>
                                <div style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                    <div style={{ color: "#fb923c", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>Hotel • Day {h.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#1f2937", fontWeight: 700, fontFamily: "'Noto Serif', 'Georgia', serif" }}>{h.name}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e5e7eb", paddingBottom: "4px" }}><span>Check-in</span><span style={{ fontWeight: 600, color: "#374151" }}>{h.checkIn}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e5e7eb", paddingBottom: "4px" }}><span>Check-out</span><span style={{ fontWeight: 600, color: "#374151" }}>{h.checkOut}</span></div>
                                        {h.bookingRef && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Reference</span><span style={{ fontWeight: 600, color: "#b48b63" }}>{h.bookingRef}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {flights.map((f, i) => (
                            <div key={`flight-${i}`} style={{ display: "flex", gap: "24px", background: "#ffffff", border: "1px solid #f3e8d8", padding: "24px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                                <div style={{ width: "100px", height: "100px", background: "#fcfaf7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", borderRadius: "8px" }}>✈️</div>
                                <div style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                    <div style={{ color: "#fb923c", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>Flight • Day {f.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#1f2937", fontWeight: 700, fontFamily: "'Noto Serif', 'Georgia', serif" }}>{f.airline}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e5e7eb", paddingBottom: "4px" }}><span>Route</span><span style={{ fontWeight: 600, color: "#374151" }}>{f.departureAirport} → {f.arrivalAirport}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e5e7eb", paddingBottom: "4px" }}><span>Departure</span><span style={{ fontWeight: 600, color: "#374151" }}>{f.departure}</span></div>
                                        {f.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span>PNR</span><span style={{ fontWeight: 600, color: "#b48b63" }}>{f.pnr}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {cabs.map((c, i) => (
                            <div key={`cab-${i}`} style={{ display: "flex", gap: "24px", background: "#ffffff", border: "1px solid #f3e8d8", padding: "24px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                                <div style={{ width: "100px", height: "100px", background: "#fcfaf7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", borderRadius: "8px" }}>🚕</div>
                                <div style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                    <div style={{ color: "#fb923c", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>Transfer • Day {c.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#1f2937", fontWeight: 700, fontFamily: "'Noto Serif', 'Georgia', serif" }}>{c.vehicleType || "Private Transfer"}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e5e7eb", paddingBottom: "4px" }}><span>Route</span><span style={{ fontWeight: 600, color: "#374151" }}>{c.route || "Local"}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e5e7eb", paddingBottom: "4px" }}><span>Pickup</span><span style={{ fontWeight: 600, color: "#374151" }}>{c.pickupTime}</span></div>
                                        {c.driverName && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Driver</span><span style={{ fontWeight: 600, color: "#b48b63" }}>{c.driverName}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {buses.map((b, i) => (
                            <div key={`bus-${i}`} style={{ display: "flex", gap: "24px", background: "#ffffff", border: "1px solid #f3e8d8", padding: "24px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                                <div style={{ width: "100px", height: "100px", background: "#fcfaf7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", borderRadius: "8px" }}>🚌</div>
                                <div style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                    <div style={{ color: "#fb923c", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>Bus • Day {b.dayIndex + 1}</div>
                                    <h4 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#1f2937", fontWeight: 700, fontFamily: "'Noto Serif', 'Georgia', serif" }}>{b.busType || "Tourist Bus"}</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e5e7eb", paddingBottom: "4px" }}><span>Route</span><span style={{ fontWeight: 600, color: "#374151" }}>{b.route}</span></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e5e7eb", paddingBottom: "4px" }}><span>Departure</span><span style={{ fontWeight: 600, color: "#374151" }}>{b.departureTime}</span></div>
                                        {b.pnr && <div style={{ display: "flex", justifyContent: "space-between" }}><span>PNR</span><span style={{ fontWeight: 600, color: "#b48b63" }}>{b.pnr}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Inclusions & Exclusions */}
            <section data-pdf-section="inclusions" style={{ padding: "88px 64px", background: "#fcfaf7" }}>
                <div style={{ display: "flex", gap: "60px", maxWidth: "1000px", margin: "0 auto" }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 12px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "3px", color: "#fb923c", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>What's Included</p>
                        <h3 style={{ margin: "0 0 32px 0", fontSize: "32px", color: "#111827", fontWeight: 500 }}>Inclusions</h3>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "16px", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                            {inclusionsList.length > 0 ? inclusionsList.map((inc, i) => (
                                <li key={i} style={{ display: "flex", gap: "16px", fontSize: "15px", color: "#374151", lineHeight: "1.7", fontWeight: 500 }}><span style={{ color: "#fb923c", fontSize: "18px", marginTop: "-2px" }}>✓</span> <span>{inc}</span></li>
                            )) : <li style={{ fontSize: "15px", color: "#9ca3af" }}>Standard inclusions apply.</li>}
                        </ul>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 12px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "3px", color: "#9ca3af", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>What's Not Included</p>
                        <h3 style={{ margin: "0 0 32px 0", fontSize: "32px", color: "#111827", fontWeight: 500 }}>Exclusions</h3>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "16px", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                            {exclusionsList.length > 0 ? exclusionsList.map((exc, i) => (
                                <li key={i} style={{ display: "flex", gap: "16px", fontSize: "15px", color: "#6b7280", lineHeight: "1.7", fontWeight: 500 }}><span style={{ color: "#d1d5db", fontSize: "18px", marginTop: "-2px" }}>✗</span> <span>{exc}</span></li>
                            )) : <li style={{ fontSize: "15px", color: "#9ca3af" }}>Personal expenses not included.</li>}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Pricing & Invoice */}
            <section data-pdf-section="pricing" style={{ padding: "88px 64px", background: "#ffffff" }}>
                <div style={{ textAlign: "center", marginBottom: "60px", pageBreakInside: "avoid", breakInside: "avoid" }}>
                    <p style={{ margin: "0 0 16px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "4px", color: "#b48b63", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>Commercials</p>
                    <h2 style={{ margin: 0, fontSize: "40px", color: "#111827", fontWeight: 500 }}>Investment Summary</h2>
                </div>

                <div style={{ maxWidth: "1000px", margin: "0 auto", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                    <div style={{ background: "#fdfcfb", border: "1px solid #f3e8d8", borderRadius: "16px", overflow: "hidden", marginBottom: "60px", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
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
                                    <tr>
                                        <td>{isManual ? "Package Cost" : "Itinerary Valuation"} (for {adultPax} Adults{childPax ? `, ${childPax} Children` : ''})</td>
                                        <td>1</td>
                                        <td>{formatCurrency(costWithMarkup, currency)}</td>
                                        <td>{formatCurrency(costWithMarkup, currency)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div style={{ background: "#fcfaf7", borderTop: "1px solid #f3e8d8", padding: "24px 32px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "14px", color: "#6b7280" }}><span>Subtotal</span><span style={{ fontWeight: 600, color: "#1f2937" }}>{formatCurrency(costWithMarkup, currency)}</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "14px", color: "#6b7280" }}><span>Taxes & Fees</span><span style={{ fontWeight: 600, color: "#1f2937" }}>{formatCurrency(taxAmount, currency)}</span></div>
                            <div style={{ width: "260px", height: "1px", background: "#f3e8d8", margin: "4px 0" }}></div>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "20px", color: "#b48b63", fontWeight: 800, fontFamily: "var(--font-mono)" }}><span>Grand Total</span><span>{formatCurrency(finalTotal, currency)}</span></div>
                        </div>
                    </div>
 
                    {/* Payment Schedule — full width */}
                    <div style={{ background: "#fcfaf7", border: "1px solid #f3e8d8", borderRadius: "16px", padding: "32px", marginBottom: "40px" }}>
                        <h3 style={{ margin: "0 0 24px 0", fontSize: "18px", color: "#111827", fontWeight: 700, fontFamily: "'Noto Serif', 'Georgia', serif" }}>Payment Schedule</h3>
                        <div className="table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none", margin: 0, background: "transparent" }}>
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
                    <div style={{ display: "flex", gap: "40px" }}>
                        <div style={{ flex: 1, background: "#fcfaf7", border: "1px solid #f3e8d8", borderRadius: "16px", padding: "32px" }}>
                            <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#111827", fontWeight: 700, fontFamily: "'Noto Serif', 'Georgia', serif" }}>Terms & Policies</h3>
                            <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.7" }}>
                                {cancellationPolicy ? parseList(cancellationPolicy).map((p, i) => <div key={i}>• {p}</div>) : "• Standard cancellation fees apply."}
                            </div>
                        </div>
                        <div style={{ flex: 1, background: "#fcfaf7", border: "1px solid #f3e8d8", borderRadius: "16px", padding: "32px" }}>
                            <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#111827", fontWeight: 700, fontFamily: "'Noto Serif', 'Georgia', serif" }}>Accepted Methods</h3>
                            <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.7" }}>
                                {paymentMethods ? parseList(paymentMethods).map((p, i) => <div key={i}>• {p}</div>) : "• Bank Transfer, Credit Card."}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
