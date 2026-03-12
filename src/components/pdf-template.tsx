import React from 'react';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import type { HotelInfo, FlightInfo } from '@/components/hotel-flight-editor';
import type { PricingConfig } from '@/types/pricing';

export type PdfTheme = 'classic' | 'editorial' | 'minimalist' | 'dark' | 'corporate';

export interface PdfTemplateProps {
    itinerary: TravelItineraryOutput | null | undefined;
    title?: string;
    userProfile?: any;
    theme?: PdfTheme;
    hotels?: HotelInfo[];
    flights?: FlightInfo[];
    pricing?: PricingConfig;
    baseCost?: number;
}

/* ───────── shared helpers ───────── */
const getAgentInfo = (userProfile: any) => ({
    primaryColor: userProfile?.brand_color || "#a855f7",
    agentName: userProfile?.full_name || "Your Travel Architect",
    companyName: userProfile?.company_name || "OdysseyLuxe",
    agentPhone: userProfile?.business_phone || "",
    agentEmail: userProfile?.business_email || "",
    agentWebsite: userProfile?.website || "",
    agentBio: userProfile?.bio || "",
});

const getTotalBudget = (itinerary: TravelItineraryOutput) =>
    itinerary.itinerary.reduce((sum, day) => {
        const costMatch = String(day.dailyStats?.totalCost || '0').match(/\d+/g);
        const cost = costMatch ? parseInt(costMatch.join(''), 10) : 0;
        return sum + cost;
    }, 0);

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1080&auto=format&fit=crop';
const getDayImage = (day: any): string => day.imageUrl || FALLBACK_IMG;
const getCoverImage = (itinerary: TravelItineraryOutput): string => getDayImage(itinerary.itinerary[0]);

const formatTitleCase = (str: string) => {
    if (!str || typeof str !== 'string') return "";
    return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
};

const formatCurrency = (val: string | number) => {
    if (!val) return "0";
    const numMatch = String(val).match(/[\d,.]+/);
    if (!numMatch) return "0";
    const numStr = numMatch[0].replace(/,/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? "0" : num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const formatDistance = (dist: string | number) => {
    if (!dist) return "0";
    const numMatch = String(dist).match(/[\d.]+/);
    return numMatch ? numMatch[0] : "0";
};

const formatDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return "";
    return dateStr.replace(/^DAY\s*\d+/i, '').replace(/^-/, '').trim();
};

const formatMoneyWithDecimals = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPlural = (count: number, singular: string, plural: string) => {
    return `${count} ${count === 1 ? singular : plural}`;
};

const getSanitizedTitle = (title: string, itinerary: TravelItineraryOutput): string => {
    let displayTitle = title || "Your Tailored Itinerary";
    if (displayTitle.toLowerCase().includes("exploration") && itinerary.itinerary.length > 0) {
        const distinctAreas = Array.from(new Set(itinerary.itinerary.map(day => day.areaFocus?.split(',')[0] || ""))).filter(Boolean);
        if (distinctAreas.length > 1) {
            displayTitle = `Journey: ${distinctAreas[0]} to ${distinctAreas[distinctAreas.length - 1]}`;
        }
    }
    return displayTitle;
};

/*
 * PAGE-BREAK STRATEGY for html2pdf.js:
 *
 * html2pdf uses html2canvas to render the ENTIRE HTML as one tall canvas,
 * then slices it into A4-sized chunks. CSS page-break hints work but have limits.
 *
 * Rules we follow:
 * 1. NO position:fixed (only renders once, not per-page)
 * 2. NO position:absolute on tall containers (gets clipped at page boundary)
 * 3. pageBreakInside:"avoid" ONLY on elements shorter than ~900px (A4 content area)
 * 4. pageBreakBefore:"always" on each day section to ensure clean page starts
 * 5. Each timeline step is self-contained (no absolute timeline lines)
 * 6. Images use fixed heights with overflow:hidden
 * 7. Footer uses pageBreakInside:"avoid" to stay together
 */

/* ───────── shared hotel / flight PDF blocks ───────── */
const THEME_PATTERNS = {
    topography: "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM15 45c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5v0zm32 0c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 23c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm63 7.004c-1.105 0-2-.896-2-2.004 0-1.105.895-2 2-2s2 .895 2 2c0 1.108-.895 2.004-2 2.004z' fill='currentColor' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E",
    minimal: "data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5z' fill='currentColor' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E",
    geometric: "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='currentColor' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E",
    diagonal: "data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.22 0l-1.415 1.414L10.392 9l-1.414 1.414L1.392 2.828 0 4.243v2.828l1.414-1.414L8.98 13.22l1.415-1.414L2.808 4.243l1.414-1.414L11.808 10.42 13.22 9V6.172l-1.414 1.414L4.22 0z' fill='currentColor' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E",
    waves: "data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.392-5.024 3.42-9.61 8.816-9.61 5.395 0 8.423 4.586 8.816 9.61H21.184zM100 20c-.392-5.59-3.92-10.39-9.825-10.39-4.886 0-8.238 3.518-9.355 7.64L78.697 16c-.576-8.525-4.57-16-12.78-16-8.21 0-12.204 7.475-12.78 16l-2.12-1.25C49.897 10.518 46.545 7 41.66 7c-5.905 0-9.434 4.802-9.826 10.39H0c.392-5.59 3.92-10.39 9.825-10.39 4.886 0 8.238 3.518 9.355 7.64l2.122 1.25c.576-8.525 4.57-16 12.78-16 8.21 0 12.204 7.475 12.78 16l2.12 1.25c1.117-4.12 4.47-7.64 9.355-7.64 5.905 0 9.434 4.802 9.826 10.39H100z' fill='currentColor' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E",
    darkDots: "data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 9l3 3-3 3-3-3 3-3zm0-2L5 4l3-3 3 3-3 3z' fill='currentColor' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E",
    moroccan: "data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15 8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15zm0 28C7.82 28 2 22.18 2 15S7.82 2 15 2s13 5.82 13 13-5.82 13-13 13zm8-13c0-4.418-3.582-8-8-8s-8 3.582-8 8 3.582 8 8 8 8-3.582 8-8z' fill='currentColor' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E"
};

const getThematicBackground = (itinerary: TravelItineraryOutput, theme: PdfTheme, agentColor: string) => {
    let patternSrc = THEME_PATTERNS.topography;
    let color = "%231e293b"; // slate-800 mostly

    const destString = (itinerary.itinerary.map(d => d.areaFocus).join(" ") + " ").toLowerCase();

    if (destString.match(/beach|island|coast|sea|ocean|resort|maldives|hawaii|bali|phuket|goa|cancun|cruise/)) {
        patternSrc = THEME_PATTERNS.waves;
    } else if (destString.match(/tokyo|new york|london|paris|city|dubai|singapore|urban|downtown/)) {
        patternSrc = THEME_PATTERNS.geometric;
    } else if (destString.match(/marrakech|morocco|istanbul|egypt|arab|middle east/)) {
        patternSrc = THEME_PATTERNS.moroccan;
    } else if (theme === 'minimalist' || theme === 'corporate') {
        patternSrc = THEME_PATTERNS.diagonal;
    } else if (theme === 'dark') {
        patternSrc = THEME_PATTERNS.darkDots;
        color = "%23ffffff";
    }

    if (agentColor && agentColor.startsWith('#') && theme !== 'dark') {
        color = "%23" + agentColor.substring(1);
    }

    return patternSrc.replace(/currentColor/g, color);
};

const glassStyles = {
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.05)",
};

const darkGlassStyles = {
    background: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
};

const PdfFlightBlock = ({ flight, accentColor, bgColor, textColor }: { flight: FlightInfo; accentColor: string; bgColor: string; textColor: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', margin: '16px 0', pageBreakInside: 'avoid', breakInside: 'avoid', ...glassStyles, background: bgColor.replace(')', ', 0.6)').replace('rgb', 'rgba'), border: `1px solid ${accentColor}30` }}>
        <span style={{ fontSize: '18px' }}>✈️</span>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', color: accentColor, fontSize: '13px' }}>{flight.airline} {flight.flightNumber}</span>
                {flight.pnr && <span style={{ fontSize: '11px', background: `${accentColor}20`, color: accentColor, padding: '2px 6px', borderRadius: '4px' }}>PNR: {flight.pnr}</span>}
            </div>
            <div style={{ fontSize: '12px', color: textColor, marginTop: '2px' }}>
                {flight.departureAirport} → {flight.arrivalAirport}
                {(flight.departure || flight.arrival) && <span style={{ marginLeft: '8px' }}>{flight.departure}{flight.departure && flight.arrival ? ' – ' : ''}{flight.arrival}</span>}
                {flight.terminal && <span style={{ marginLeft: '8px' }}>Terminal {flight.terminal}</span>}
            </div>
        </div>
    </div>
);

const PdfHotelBlock = ({ hotel, accentColor, bgColor, textColor }: { hotel: HotelInfo; accentColor: string; bgColor: string; textColor: string }) => {
    const hasImages = hotel.imageUrls && hotel.imageUrls.length > 0;
    const isSingleImage = hotel.imageUrls?.length === 1;
    return (
        <div style={{ padding: '16px', borderRadius: '8px', margin: '16px 0', pageBreakInside: 'avoid', breakInside: 'avoid', ...glassStyles, background: bgColor.replace(')', ', 0.6)').replace('rgb', 'rgba'), border: `1px solid ${accentColor}30` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '18px', display: 'block', marginTop: '2px' }}>🏨</span>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold', color: accentColor, fontSize: '15px' }}>{hotel.name || 'Hotel'}</span>
                        <span style={{ color: '#f59e0b', fontSize: '13px' }}>{'★'.repeat(hotel.starRating)}{'☆'.repeat(5 - hotel.starRating)}</span>
                        {hotel.bookingRef && <span style={{ fontSize: '11px', background: `${accentColor}20`, color: accentColor, padding: '2px 6px', borderRadius: '4px' }}>Ref: {hotel.bookingRef}</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: textColor, marginTop: '4px' }}>
                        {hotel.address && <span style={{ marginRight: '4px' }}>{hotel.address} •</span>}
                        <span>Check-in: {hotel.checkIn} • Check-out: {hotel.checkOut}</span>
                    </div>
                </div>
            </div>
            {hasImages && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                    {hotel.imageUrls!.map((url, idx) => (
                        <div key={idx} style={{
                            flex: isSingleImage ? '1 1 100%' : '1 1 calc(50% - 4px)',
                            height: isSingleImage ? '240px' : '160px'
                        }}>
                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', display: 'block' }} crossOrigin="anonymous" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

type ThemeProps = { itinerary: TravelItineraryOutput; title: string; agent: ReturnType<typeof getAgentInfo> };

/* ═══════════════════════════════════════════════
   THEME 1 — CLASSIC
   ═══════════════════════════════════════════════ */
const ClassicTheme = ({ itinerary, title, agent }: ThemeProps) => (
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
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>{itinerary.itinerary.length} Days</p>
                    </div>
                    <div style={{ flex: 1, borderRadius: "12px", padding: "20px", borderLeft: "4px solid #ec4899", ...glassStyles }}>
                        <h3 style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Total Budget</h3>
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>₹{getTotalBudget(itinerary).toLocaleString()}</p>
                    </div>
                </div>

            </div>{/* end cover section */}
        </div>
        {/* Daily itineraries */}
        {itinerary.itinerary.map((day, index) => (
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
                    {day.timeline.map((step, si) => (
                        <div key={si} className="pdf-no-cut" style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: si === day.timeline.length - 1 ? "0" : "14px", paddingBottom: si === day.timeline.length - 1 ? "0" : "14px", borderBottom: si === day.timeline.length - 1 ? "none" : "1px solid rgba(255,255,255,0.4)", pageBreakInside: "avoid", breakInside: "avoid" }}>
                            <span style={{ fontWeight: "bold", color: "#a855f7", fontSize: "13px", background: "rgba(243, 232, 255, 0.7)", padding: "5px 14px", borderRadius: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, minWidth: "90px", textAlign: "center" }}>{step.time}</span>
                            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#475569", flex: 1 }}>{step.details}</p>
                        </div>
                    ))}
                    <div style={{ marginTop: "18px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.4)", display: "flex", gap: "20px", fontSize: "13px", color: "#64748b", fontWeight: 500, pageBreakInside: "avoid", breakInside: "avoid" }}>
                        <div>🏃‍♂️ Distance: {formatDistance(day.dailyStats?.walkingDistance)} km</div>
                        <div>💰 Budget: ₹{formatCurrency(day.dailyStats?.totalCost)}</div>
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

/* ═══════════════════════════════════════════════
   THEME 2 — EDITORIAL
   ═══════════════════════════════════════════════ */
const EditorialTheme = ({ itinerary, title, agent }: ThemeProps) => {
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
                        <p style={{ fontSize: "16px", opacity: 0.85, margin: 0, fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 300 }}>{itinerary.itinerary.length}-Day Journey • Curated by {agent.agentName}</p>
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
                            <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 5px 0", fontStyle: "italic" }}>{itinerary.itinerary.length}</p>
                            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "3px", color: "#999", fontFamily: "'Helvetica Neue', sans-serif", margin: 0 }}>Days</p>
                        </div>
                        <div style={{ width: "1px", background: "#ddd" }} />
                        <div>
                            <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 5px 0", fontStyle: "italic" }}>₹{getTotalBudget(itinerary).toLocaleString()}</p>
                            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "3px", color: "#999", fontFamily: "'Helvetica Neue', sans-serif", margin: 0 }}>Estimated Budget</p>
                        </div>
                        <div style={{ width: "1px", background: "#ddd" }} />
                        <div>
                            <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 5px 0", fontStyle: "italic" }}>{itinerary.itinerary.reduce((s, d) => s + d.timeline.length, 0)}+</p>
                            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "3px", color: "#999", fontFamily: "'Helvetica Neue', sans-serif", margin: 0 }}>Experiences</p>
                        </div>
                    </div>

                </div>{/* end cover */}
            </div>
            {/* Daily */}
            {itinerary.itinerary.map((day, index) => (
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
                    {day.timeline.map((step, si) => (
                        <div key={si} style={{ marginBottom: "20px", paddingLeft: "20px", borderLeft: `2px solid ${gold}`, pageBreakInside: "avoid" }}>
                            <p style={{ fontSize: "13px", color: gold, fontWeight: "bold", margin: "0 0 6px 0", fontFamily: "'Helvetica Neue', sans-serif", letterSpacing: "1px" }}>{step.time}</p>
                            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "#444", margin: 0 }}>{step.details}</p>
                        </div>
                    ))}

                    <div style={{ display: "flex", gap: "30px", marginTop: "15px", fontSize: "12px", color: "#999", fontFamily: "'Helvetica Neue', sans-serif", pageBreakInside: "avoid" }}>
                        {day.dailyStats?.walkingDistance && <span>{formatDistance(day.dailyStats?.walkingDistance)} km walking</span>}
                        {day.dailyStats?.totalCost && <span>Est. ₹{formatCurrency(day.dailyStats?.totalCost)}</span>}
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

/* ═══════════════════════════════════════════════
   THEME 3 — MINIMALIST
   ═══════════════════════════════════════════════ */
const MinimalistTheme = ({ itinerary, title, agent }: ThemeProps) => {
    const accent = agent.primaryColor || "#000000";
    const totalActivities = itinerary.itinerary.reduce((s, d) => s + d.timeline.length, 0);
    return (
        /* No backgroundImage — keep it truly minimal and clean */
        <div style={{ fontFamily: "'Helvetica Neue', 'Arial', sans-serif", backgroundColor: "#ffffff", color: "#111", width: "100%" }}>

            {/* ── Cover strip image ── */}
            <div data-pdf-section="cover">
                <div style={{ height: "220px", overflow: "hidden", position: "relative" }}>
                    <img
                        src={getCoverImage(itinerary)}
                        alt=""
                        style={{ width: "100%", height: "220px", objectFit: "cover", display: "block", filter: "brightness(0.75)" }}
                        crossOrigin="anonymous"
                    />
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${accent}cc, transparent)` }} />
                    <div style={{ position: "absolute", bottom: "30px", left: "50px", color: "#fff" }}>
                        <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "5px", margin: "0 0 10px 0", opacity: 0.85 }}>{agent.companyName}</p>
                        <h1 style={{ fontSize: "42px", fontWeight: 900, margin: 0, lineHeight: "1.08", textTransform: "uppercase", letterSpacing: "-1px", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{title}</h1>
                    </div>
                </div>

                {/* ── Accent bar ── */}
                <div style={{ height: "4px", background: accent }} />

                {/* ── Main cover body ── */}
                <div style={{ padding: "40px 50px" }}>

                    {/* Headline summary */}
                    <p style={{ fontSize: "14px", color: "#666", margin: "0 0 30px 0", lineHeight: "1.6" }}>
                        {itinerary.itinerary.length}-day journey · Curated by {agent.agentName}
                    </p>

                    {/* Stat cards row */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "35px", pageBreakInside: "avoid" }}>
                        {[
                            { label: "Duration", value: `${itinerary.itinerary.length} Days` },
                            { label: "Est. Budget", value: `₹${getTotalBudget(itinerary).toLocaleString()}` },
                            { label: "Activities", value: `${totalActivities}+` },
                        ].map((stat, i) => (
                            <div key={i} style={{ flex: 1, padding: "18px 20px", borderTop: `3px solid ${accent}`, background: "#f8f9fa" }}>
                                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#999", margin: "0 0 6px 0" }}>{stat.label}</p>
                                <p style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: "#111" }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Agent details row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: "25px", borderTop: "1px solid #e5e7eb", pageBreakInside: "avoid" }}>
                        {/* Bio */}
                        <div style={{ flex: 2, paddingRight: "40px" }}>
                            {agent.agentBio && (
                                <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "16px" }}>
                                    <p style={{ fontSize: "13px", lineHeight: "1.8", color: "#555", margin: 0, fontStyle: "italic" }}>{agent.agentBio}</p>
                                </div>
                            )}
                        </div>
                        {/* Contact */}
                        <div style={{ flex: 1, textAlign: "right", fontSize: "12px", color: "#666", lineHeight: "2" }}>
                            <p style={{ fontWeight: 800, color: "#111", fontSize: "14px", margin: "0 0 4px 0" }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ margin: "2px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ margin: "2px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ margin: "2px 0", color: accent, fontWeight: 600 }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Daily itinerary ── */}
            <div style={{ padding: "0 50px 50px" }}>
                {itinerary.itinerary.map((day, index) => (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "30px", display: "block" }}>

                        {/* Day header — image thumbnail + title side by side */}
                        <div style={{ display: "flex", alignItems: "stretch", gap: "0", marginBottom: "14px", pageBreakInside: "avoid", pageBreakAfter: "avoid", breakInside: "avoid" }}>
                            <img
                                src={getDayImage(day)}
                                alt={formatTitleCase(day.areaFocus)}
                                style={{ width: "90px", height: "90px", objectFit: "cover", flexShrink: 0, display: "block" }}
                                crossOrigin="anonymous"
                            />
                            <div style={{ flex: 1, padding: "12px 18px", background: "#f8f9fa", borderTop: `3px solid ${accent}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                                    <span style={{ fontSize: "28px", fontWeight: 900, color: accent, lineHeight: 1 }}>{String(index + 1).padStart(2, '0')}</span>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", color: "#111" }}>{formatTitleCase(day.areaFocus)}</h3>
                                </div>
                                <div style={{ display: "flex", gap: "16px", marginTop: "5px", fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                                    {day.date && <span>{formatDate(day.date)}</span>}
                                    {day.dailyStats?.walkingDistance && <span>{formatDistance(day.dailyStats?.walkingDistance)} km walk</span>}
                                    {day.dailyStats?.totalCost && <span>₹{formatCurrency(day.dailyStats?.totalCost)}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Activities */}
                        <div style={{ borderTop: "1px solid #eee" }}>
                            {day.timeline.map((step, si) => (
                                <div key={si} className="pdf-no-cut" style={{ display: "flex", gap: "20px", padding: "12px 16px", margin: "8px 0", background: "#f8f9fa", borderRadius: "6px", pageBreakInside: "avoid" }}>
                                    <div style={{ width: "75px", flexShrink: 0, fontSize: "12px", fontWeight: 700, color: accent }}>{step.time}</div>
                                    <p style={{ flex: 1, margin: 0, fontSize: "13px", lineHeight: "1.6", color: "#444" }}>{step.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Footer ── */}
            <div data-pdf-section="footer" style={{ padding: "16px 50px", borderTop: `3px solid ${accent}`, display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#bbb", textTransform: "uppercase", letterSpacing: "2px", background: "#f8f9fa" }}>
                <span>{agent.companyName}</span>
                <span>{new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   THEME 4 — DARK MODE
   ═══════════════════════════════════════════════ */
const DarkTheme = ({ itinerary, title, agent }: ThemeProps) => {
    const accent = agent.primaryColor || "#a855f7";
    const totalActivities = itinerary.itinerary.reduce((sum, d) => sum + d.timeline.length, 0);
    return (
        /* No repeating dot background — clean pure dark */
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#0a0e1a", color: "#e2e8f0", width: "100%" }}>

            {/* ── Cover image ── */}
            <div data-pdf-section="cover">
                <div style={{ position: "relative", height: "260px", overflow: "hidden" }}>
                    <img
                        src={getCoverImage(itinerary)}
                        alt=""
                        style={{ width: "100%", height: "260px", objectFit: "cover", display: "block", filter: "brightness(0.35) saturate(0.5)" }}
                        crossOrigin="anonymous"
                    />
                    {/* gradient: dark left panel for text */}
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, rgba(10,14,26,0.92) 38%, rgba(10,14,26,0.2))` }} />
                    <div style={{ position: "absolute", bottom: "35px", left: "48px", zIndex: 1 }}>
                        <p style={{ fontSize: "11px", letterSpacing: "5px", textTransform: "uppercase", color: accent, margin: "0 0 12px 0" }}>{agent.companyName}</p>
                        <h1 style={{ fontSize: "38px", fontWeight: 900, margin: "0 0 6px 0", color: "#f1f5f9", lineHeight: "1.1", letterSpacing: "-0.5px" }}>{title}</h1>
                        <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Curated by {agent.agentName}</p>
                    </div>
                </div>

                {/* ── Accent bar ── */}
                <div style={{ height: "3px", background: `linear-gradient(to right, ${accent}, transparent)` }} />

                {/* ── Cover body ── */}
                <div style={{ padding: "36px 48px" }}>

                    {/* Stat cards */}
                    <div style={{ display: "flex", gap: "14px", marginBottom: "32px", pageBreakInside: "avoid" }}>
                        {[
                            { label: "Duration", value: `${itinerary.itinerary.length} Days` },
                            { label: "Est. Budget", value: `₹${getTotalBudget(itinerary).toLocaleString()}` },
                            { label: "Activities", value: `${totalActivities}+` },
                        ].map((stat, i) => (
                            <div key={i} style={{ flex: 1, padding: "18px 20px", borderTop: `3px solid ${accent}`, background: "rgba(255,255,255,0.04)", borderRadius: "0 0 8px 8px" }}>
                                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#64748b", margin: "0 0 6px 0" }}>{stat.label}</p>
                                <p style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: accent }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Agent details: bio left, contact right */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", pageBreakInside: "avoid" }}>
                        <div style={{ flex: 2, paddingRight: "40px" }}>
                            {agent.agentBio && (
                                <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "16px" }}>
                                    <p style={{ fontSize: "13px", lineHeight: "1.8", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>{agent.agentBio}</p>
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontSize: "12px", color: "#64748b", lineHeight: "2" }}>
                            <p style={{ fontWeight: 800, color: "#e2e8f0", fontSize: "14px", margin: "0 0 4px 0" }}>{agent.agentName}</p>
                            {agent.agentPhone && <p style={{ margin: "2px 0" }}>{agent.agentPhone}</p>}
                            {agent.agentEmail && <p style={{ margin: "2px 0" }}>{agent.agentEmail}</p>}
                            {agent.agentWebsite && <p style={{ margin: "2px 0", color: accent, fontWeight: 600 }}>{agent.agentWebsite}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Daily itinerary ── */}
            <div style={{ padding: "0 48px 48px" }}>
                {itinerary.itinerary.map((day, index) => (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "20px", display: "block" }}>

                        {/* Day header: thumbnail + info panel side-by-side */}
                        <div style={{ display: "flex", alignItems: "stretch", marginBottom: "12px", pageBreakInside: "avoid", pageBreakAfter: "avoid", breakInside: "avoid" }}>
                            <img
                                src={getDayImage(day)}
                                alt={formatTitleCase(day.areaFocus)}
                                style={{ width: "90px", height: "90px", objectFit: "cover", flexShrink: 0, display: "block", filter: "brightness(0.6) saturate(0.7)" }}
                                crossOrigin="anonymous"
                            />
                            <div style={{ flex: 1, padding: "12px 18px", borderTop: `3px solid ${accent}`, background: "rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                                    <span style={{ fontSize: "26px", fontWeight: 900, color: accent, lineHeight: 1 }}>{String(index + 1).padStart(2, '0')}</span>
                                    <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", color: "#f1f5f9" }}>{formatTitleCase(day.areaFocus)}</h3>
                                </div>
                                <div style={{ display: "flex", gap: "14px", marginTop: "5px", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                                    {day.date && <span>{formatDate(day.date)}</span>}
                                    {day.dailyStats?.walkingDistance && <span>{formatDistance(day.dailyStats?.walkingDistance)} km walk</span>}
                                    {day.dailyStats?.totalCost && <span style={{ color: accent }}>₹{formatCurrency(day.dailyStats?.totalCost)}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Activities */}
                        <div style={{ padding: "16px 20px", borderRadius: "0 0 10px 10px", background: "rgba(15, 23, 42, 0.5)" }}>
                            {day.timeline.map((step, si) => (
                                <div key={si} className="pdf-no-cut" style={{ display: "flex", gap: "14px", marginBottom: si === day.timeline.length - 1 ? "0" : "10px", padding: "10px 14px", borderLeft: `3px solid ${accent}50`, borderRadius: "0 6px 6px 0", background: "rgba(255,255,255,0.03)", pageBreakInside: "avoid" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: accent, width: "68px", flexShrink: 0 }}>{step.time}</span>
                                    <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6", color: "#cbd5e1" }}>{step.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Footer ── */}
            <div data-pdf-section="footer" style={{ padding: "18px 48px", borderTop: `3px solid ${accent}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#334155", textTransform: "uppercase", letterSpacing: "2px" }}>Powered by GozyTrips</p>
                <p style={{ margin: 0, fontSize: "13px", color: accent, fontWeight: 700, letterSpacing: "1px" }}>{agent.companyName}</p>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   THEME 5 — CORPORATE
   ═══════════════════════════════════════════════ */
const CorporateTheme = ({ itinerary, title, agent }: ThemeProps) => {
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
                        <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>Document generated on {new Date().toLocaleDateString()} • {itinerary.itinerary.length}-day itinerary</p>
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
                            <div style={{ padding: "10px 15px", flex: "0 0 60%", fontWeight: "bold" }}>{itinerary.itinerary.length} Days</div>
                        </div>
                        <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
                            <div style={{ padding: "10px 15px", flex: "0 0 40%" }}>Estimated Budget</div>
                            <div style={{ padding: "10px 15px", flex: "0 0 60%", fontWeight: "bold" }}>₹{getTotalBudget(itinerary).toLocaleString()}</div>
                        </div>
                        <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
                            <div style={{ padding: "10px 15px", flex: "0 0 40%" }}>Total Activities</div>
                            <div style={{ padding: "10px 15px", flex: "0 0 60%", fontWeight: "bold" }}>{itinerary.itinerary.reduce((s, d) => s + d.timeline.length, 0)}</div>
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
            {itinerary.itinerary.map((day, index) => (
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
                        {day.timeline.map((step, si) => (
                            <div key={si} className="pdf-no-cut" style={{ display: "flex", background: si % 2 === 0 ? "#ffffff" : "#fafbfc", pageBreakInside: "avoid", borderBottom: "1px solid #eee" }}>
                                <div style={{ padding: "10px 15px", flex: "0 0 100px", fontWeight: "bold", color: navy }}>{step.time}</div>
                                <div style={{ padding: "10px 15px", flex: 1, lineHeight: "1.5", color: "#444" }}>{step.details}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: "30px", padding: "8px 15px", background: "#f7f9fc", borderBottom: "1px solid #ddd", fontSize: "12px", color: "#666", pageBreakInside: "avoid" }}>
                        {day.dailyStats?.walkingDistance && <span>Walking: {formatDistance(day.dailyStats?.walkingDistance)} km</span>}
                        {day.dailyStats?.totalCost && <span>Est. Cost: ₹{formatCurrency(day.dailyStats?.totalCost)}</span>}
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

/* ═════════ PRICING PAGE ═════════ */
const PdfPricingPage = ({ pricing, baseCost = 0, agent }: { pricing: PricingConfig; baseCost?: number; agent: ReturnType<typeof getAgentInfo> }) => {
    const markupAmount = pricing.markupType === "percentage"
        ? (baseCost * pricing.markupValue) / 100
        : pricing.markupValue;
    const costWithMarkup = baseCost + markupAmount;
    const taxAmount = (costWithMarkup * pricing.taxPercentage) / 100;
    const finalTotal = costWithMarkup + taxAmount;
    const currency = pricing.currency;

    return (
        <div data-pdf-section="pricing" style={{ padding: "60px 50px", fontFamily: "'Inter', sans-serif", color: "#1e293b", backgroundColor: "#ffffff" }}>
            <h2 style={{ fontSize: "28px", color: agent.primaryColor, marginBottom: "30px", borderBottom: `2px solid ${agent.primaryColor}`, paddingBottom: "15px" }}>
                Costing & Payment Schedule
            </h2>

            <div style={{ display: "flex", gap: "40px", marginBottom: "40px" }}>
                <div style={{ flex: 1, backgroundColor: "#f8fafc", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0", pageBreakInside: "avoid" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Client Quote</h3>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "15px", color: "#475569" }}>
                        <span>Package Cost (Incl. Accommodations, Flights, Activities)</span>
                        <span>{currency} {formatMoneyWithDecimals(costWithMarkup)}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "15px", color: "#475569" }}>
                        <span>Taxes & Fees</span>
                        <span>{currency} {formatMoneyWithDecimals(taxAmount)}</span>
                    </div>

                    <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "2px solid #cbd5e1", display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>
                        <span>Total Quote</span>
                        <span>{currency} {formatMoneyWithDecimals(finalTotal)}</span>
                    </div>
                    <div style={{ marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
                        Pricing is valid for the specified dates and {formatPlural(pricing.adultPax, 'Adult', 'Adults')}{pricing.childPax > 0 ? `, ${formatPlural(pricing.childPax, 'Child', 'Children')}` : ''}{pricing.infantPax > 0 ? `, ${formatPlural(pricing.infantPax, 'Infant', 'Infants')}` : ''} only.
                    </div>
                </div>
            </div>

            {pricing.milestones && pricing.milestones.length > 0 && (
                <div style={{ pageBreakInside: "avoid" }}>
                    <h3 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "20px", fontWeight: "bold" }}>Payment Schedule</h3>
                    <div style={{ width: "100%", fontSize: "14px", display: "flex", flexDirection: "column" }}>
                        {/* Header Row */}
                        <div style={{ display: "flex", width: "100%", backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                            <div style={{ padding: "12px 15px", flex: "0 0 40%", color: "#475569", fontWeight: "bold", textAlign: "left" }}>Milestone</div>
                            <div style={{ padding: "12px 15px", flex: "0 0 35%", color: "#475569", fontWeight: "bold", textAlign: "left" }}>Timeline / Due Date</div>
                            <div style={{ padding: "12px 15px", flex: "0 0 25%", color: "#475569", fontWeight: "bold", textAlign: "right" }}>Amount</div>
                        </div>
                        {/* Body Rows */}
                        {pricing.milestones.map((m, i) => {
                            const amount = (finalTotal * m.percentage) / 100;
                            return (
                                <div key={i} style={{ display: "flex", width: "100%", borderBottom: "1px solid #e2e8f0" }}>
                                    <div style={{ padding: "15px", flex: "0 0 40%", color: "#0f172a", fontWeight: 500 }}>{m.name} ({m.percentage}%)</div>
                                    <div style={{ padding: "15px", flex: "0 0 35%", color: "#64748b" }}>{m.dueDate}</div>
                                    <div style={{ padding: "15px", flex: "0 0 25%", textAlign: "right", color: "#0f172a", fontWeight: "bold" }}>{currency} {formatMoneyWithDecimals(amount)}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const PdfFlightAndHotelSummary = ({ flights, hotels, accentColor }: { flights: FlightInfo[], hotels: HotelInfo[], accentColor: string }) => {
    if ((!flights || flights.length === 0) && (!hotels || hotels.length === 0)) return null;
    return (
        <div data-pdf-section="flights-hotels-summary" style={{ padding: "40px 50px", fontFamily: "'Inter', sans-serif", color: "#1e293b", backgroundColor: "#ffffff" }}>
            <h2 style={{ fontSize: "28px", color: accentColor, marginBottom: "30px", borderBottom: `2px solid ${accentColor}`, paddingBottom: "15px" }}>
                Flights & Accommodations
            </h2>
            {flights && flights.length > 0 && (
                <div style={{ marginBottom: "30px" }}>
                    <h3 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "15px", fontWeight: "bold" }}>Flight Details</h3>
                    {flights.map((flight, fi) => (
                        <PdfFlightBlock key={fi} flight={flight} accentColor={accentColor} bgColor="#f8fafc" textColor="#475569" />
                    ))}
                </div>
            )}
            {hotels && hotels.length > 0 && (
                <div>
                    <h3 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "15px", fontWeight: "bold" }}>Hotel Details</h3>
                    {hotels.map((hotel, hi) => (
                        <PdfHotelBlock key={hi} hotel={hotel} accentColor={accentColor} bgColor="#f8fafc" textColor="#475569" />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ═════════ MAIN EXPORTED COMPONENT ═════════ */
export const PdfTemplate = ({ itinerary, title, userProfile, theme = 'classic', hotels = [], flights = [], pricing, baseCost }: PdfTemplateProps) => {
    if (!itinerary) return null;

    const agent = getAgentInfo(userProfile);
    const displayTitle = getSanitizedTitle(title || "", itinerary);

    let ThemeComponent;
    switch (theme) {
        case 'editorial':
            ThemeComponent = <EditorialTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
            break;
        case 'minimalist':
            ThemeComponent = <MinimalistTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
            break;
        case 'dark':
            ThemeComponent = <DarkTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
            break;
        case 'corporate':
            ThemeComponent = <CorporateTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
            break;
        case 'classic':
        default:
            ThemeComponent = <ClassicTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
            break;
    }

    return (
        <div style={{ position: "relative" }}>
            {ThemeComponent}
            <PdfFlightAndHotelSummary flights={flights} hotels={hotels} accentColor={agent.primaryColor} />
            {pricing && <PdfPricingPage pricing={pricing} baseCost={baseCost} agent={agent} />}
        </div>
    );
};
