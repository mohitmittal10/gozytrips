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
const PdfFlightBlock = ({ flight, accentColor, bgColor, textColor }: { flight: FlightInfo; accentColor: string; bgColor: string; textColor: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', background: bgColor, border: `1px solid ${accentColor}30`, margin: '16px 0', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
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

const PdfHotelBlock = ({ hotel, accentColor, bgColor, textColor }: { hotel: HotelInfo; accentColor: string; bgColor: string; textColor: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', background: bgColor, border: `1px solid ${accentColor}30`, margin: '16px 0', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <span style={{ fontSize: '18px' }}>🏨</span>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', color: accentColor, fontSize: '13px' }}>{hotel.name || 'Hotel'}</span>
                <span style={{ color: '#f59e0b', fontSize: '12px' }}>{'★'.repeat(hotel.starRating)}{'☆'.repeat(5 - hotel.starRating)}</span>
                {hotel.bookingRef && <span style={{ fontSize: '11px', background: `${accentColor}20`, color: accentColor, padding: '2px 6px', borderRadius: '4px' }}>Ref: {hotel.bookingRef}</span>}
            </div>
            <div style={{ fontSize: '12px', color: textColor, marginTop: '2px' }}>
                {hotel.address && <span>{hotel.address} • </span>}
                Check-in: {hotel.checkIn} • Check-out: {hotel.checkOut}
            </div>
        </div>
    </div>
);

type ThemeProps = { itinerary: TravelItineraryOutput; title: string; agent: ReturnType<typeof getAgentInfo>; hotels: HotelInfo[]; flights: FlightInfo[] };

/* ═══════════════════════════════════════════════
   THEME 1 — CLASSIC
   ═══════════════════════════════════════════════ */
const ClassicTheme = ({ itinerary, title, agent, hotels, flights }: ThemeProps) => (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#faf9f7", color: "#1e293b", width: "100%" }}>
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
                            <div style={{ padding: "15px 20px", borderRadius: "8px", borderLeft: `4px solid ${agent.primaryColor}`, fontStyle: "italic", color: "#475569", fontSize: "14px", backgroundColor: "#f8fafc", lineHeight: "1.6" }}>
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
                    <div style={{ flex: 1, background: "#f8fafc", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", borderLeft: "4px solid #a855f7" }}>
                        <h3 style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Duration</h3>
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>{itinerary.itinerary.length} Days</p>
                    </div>
                    <div style={{ flex: 1, background: "#f8fafc", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", borderLeft: "4px solid #ec4899" }}>
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
                <div style={{ border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 16px 16px", padding: "20px 25px", backgroundColor: "#faf9f7" }}>
                    {flights.filter(f => f.dayIndex === index).map((flight, fi) => (
                        <PdfFlightBlock key={fi} flight={flight} accentColor="#10b981" bgColor="#ecfdf5" textColor="#475569" />
                    ))}
                    {day.timeline.map((step, si) => (
                        <div key={si} className="pdf-no-cut" style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: si === day.timeline.length - 1 ? "0" : "14px", paddingBottom: si === day.timeline.length - 1 ? "0" : "14px", borderBottom: si === day.timeline.length - 1 ? "none" : "1px solid #f1f5f9", pageBreakInside: "avoid", breakInside: "avoid" }}>
                            <span style={{ fontWeight: "bold", color: "#a855f7", fontSize: "13px", background: "#f3e8ff", padding: "5px 14px", borderRadius: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, minWidth: "90px", textAlign: "center" }}>{step.time}</span>
                            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#475569", flex: 1 }}>{step.details}</p>
                        </div>
                    ))}
                    <div style={{ marginTop: "18px", paddingTop: "15px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "20px", fontSize: "13px", color: "#64748b", fontWeight: 500, pageBreakInside: "avoid", breakInside: "avoid" }}>
                        <div>🏃‍♂️ Distance: {formatDistance(day.dailyStats?.walkingDistance)} km</div>
                        <div>💰 Budget: ₹{formatCurrency(day.dailyStats?.totalCost)}</div>
                    </div>
                    {hotels.filter(h => h.dayIndex === index).map((hotel, hi) => (
                        <PdfHotelBlock key={hi} hotel={hotel} accentColor="#3b82f6" bgColor="#eff6ff" textColor="#475569" />
                    ))}
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
const EditorialTheme = ({ itinerary, title, agent, hotels, flights }: ThemeProps) => {
    const gold = "#b8860b";
    return (
        <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", backgroundColor: "#fdfcfa", color: "#2c2c2c", width: "100%" }}>
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
                                <blockquote style={{ fontSize: "20px", lineHeight: "1.8", color: "#555", fontStyle: "italic", margin: 0, padding: 0 }}>
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
                    {flights.filter(f => f.dayIndex === index).map((flight, fi) => (
                        <PdfFlightBlock key={fi} flight={flight} accentColor={gold} bgColor="#fefce8" textColor="#666" />
                    ))}
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
                    {hotels.filter(h => h.dayIndex === index).map((hotel, hi) => (
                        <PdfHotelBlock key={hi} hotel={hotel} accentColor={gold} bgColor="#fefce8" textColor="#666" />
                    ))}
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
const MinimalistTheme = ({ itinerary, title, agent, hotels, flights }: ThemeProps) => {
    const accent = agent.primaryColor || "#000000";
    return (
        <div style={{ fontFamily: "'Helvetica Neue', 'Arial', sans-serif", backgroundColor: "#f8f9fa", color: "#111", width: "100%", padding: "60px" }}>
            {/* Header — cover section */}
            <div data-pdf-section="cover" style={{ marginBottom: "40px" }}>
                <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "5px", color: "#999", margin: "0 0 20px 0" }}>{agent.companyName} / {agent.agentName}</p>
                <h1 style={{ fontSize: "48px", fontWeight: 900, margin: "0 0 15px 0", lineHeight: "1.1", textTransform: "uppercase", letterSpacing: "-1px" }}>{title}</h1>
                <div style={{ width: "60px", height: "4px", background: accent, marginBottom: "20px" }} />
                <p style={{ fontSize: "14px", color: "#666", margin: 0, maxWidth: "500px", lineHeight: "1.6" }}>
                    {itinerary.itinerary.length} days • ₹{getTotalBudget(itinerary).toLocaleString()} estimated budget
                </p>
            </div>

            {/* Contact */}
            <div style={{ display: "flex", gap: "30px", marginBottom: "40px", paddingBottom: "30px", borderBottom: "1px solid #eee", fontSize: "12px", color: "#888", pageBreakInside: "avoid" }}>
                {agent.agentPhone && <span>{agent.agentPhone}</span>}
                {agent.agentEmail && <span>{agent.agentEmail}</span>}
                {agent.agentWebsite && <span style={{ color: accent }}>{agent.agentWebsite}</span>}
            </div>

            {agent.agentBio && (
                <div style={{ margin: "0 0 40px 0", padding: "0 0 0 20px", borderLeft: `3px solid ${accent}`, maxWidth: "600px", pageBreakInside: "avoid" }}>
                    <p style={{ fontSize: "14px", lineHeight: "1.8", color: "#555", margin: 0, fontStyle: "italic" }}>{agent.agentBio}</p>
                </div>
            )}

            {/* Daily */}
            {itinerary.itinerary.map((day, index) => (
                <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "20px", display: "block" }}>
                    {/* Day header with thumbnail — keep together */}
                    <div style={{ display: "block", alignItems: "flex-start", gap: "20px", marginBottom: "15px", pageBreakInside: "avoid", pageBreakAfter: "avoid", breakInside: "avoid" }}>
                        <img src={getDayImage(day)} alt={formatTitleCase(day.areaFocus)} style={{ width: "80px", height: "80px", objectFit: "cover", flexShrink: 0 }} crossOrigin="anonymous" />
                        <div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                                <span style={{ fontSize: "32px", fontWeight: 900, color: accent }}>{String(index + 1).padStart(2, '0')}</span>
                                <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>{formatTitleCase(day.areaFocus)}</h3>
                            </div>
                            <div style={{ display: "flex", gap: "20px", marginTop: "6px", fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "2px" }}>
                                <span>{formatDate(day.date)}</span>
                                {day.dailyStats?.walkingDistance && <span>{formatDistance(day.dailyStats?.walkingDistance)} km walk</span>}
                                {day.dailyStats?.totalCost && <span>₹{formatCurrency(day.dailyStats?.totalCost)}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Activities — each row avoids break */}
                    <div style={{ borderTop: "1px solid #eee" }}>
                        {flights.filter(f => f.dayIndex === index).map((flight, fi) => (
                            <PdfFlightBlock key={fi} flight={flight} accentColor={accent} bgColor="#f0fdf4" textColor="#666" />
                        ))}
                        {day.timeline.map((step, si) => (
                            <div key={si} className="pdf-no-cut" style={{ display: "flex", gap: "20px", padding: "14px 0", borderBottom: "1px solid #f5f5f5", pageBreakInside: "avoid" }}>
                                <div style={{ width: "80px", flexShrink: 0, fontSize: "13px", fontWeight: 700, color: accent }}>{step.time}</div>
                                <p style={{ flex: 1, margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#444" }}>{step.details}</p>
                            </div>
                        ))}
                        {hotels.filter(h => h.dayIndex === index).map((hotel, hi) => (
                            <PdfHotelBlock key={hi} hotel={hotel} accentColor={accent} bgColor="#eff6ff" textColor="#666" />
                        ))}
                    </div>
                </div>
            ))}

            {/* Footer */}
            <div data-pdf-section="footer" style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #ddd", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#bbb", textTransform: "uppercase", letterSpacing: "2px" }}>
                <span>{agent.companyName}</span>
                <span>{new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   THEME 4 — DARK MODE
   ═══════════════════════════════════════════════ */
const DarkTheme = ({ itinerary, title, agent, hotels, flights }: ThemeProps) => {
    const accent = agent.primaryColor || "#a855f7";
    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#0a0e1a", color: "#e2e8f0", width: "100%" }}>
            {/* Hero — cover section */}
            <div data-pdf-section="cover" style={{ position: "relative", height: "300px", overflow: "hidden" }}>
                <img src={getCoverImage(itinerary)} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.3) saturate(0.5)" }} crossOrigin="anonymous" />
                <div style={{ position: "absolute", bottom: "40px", left: "40px", zIndex: 1 }}>
                    <p style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: accent, margin: "0 0 12px 0" }}>{agent.companyName}</p>
                    <h1 style={{ fontSize: "40px", fontWeight: "bold", margin: "0 0 8px 0", color: "#ffffff" }}>{title}</h1>
                    <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>Crafted by {agent.agentName}</p>
                </div>
            </div>

            <div style={{ padding: "40px" }}>
                {/* Agent info */}
                <div style={{ background: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "25px 30px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                        {agent.agentBio && <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, fontStyle: "italic", lineHeight: "1.7" }}>&quot;{agent.agentBio}&quot;</p>}
                    </div>
                    <div style={{ textAlign: "right", fontSize: "13px", color: "#64748b", lineHeight: "2" }}>
                        {agent.agentPhone && <p style={{ margin: "2px 0" }}>{agent.agentPhone}</p>}
                        {agent.agentEmail && <p style={{ margin: "2px 0" }}>{agent.agentEmail}</p>}
                        {agent.agentWebsite && <p style={{ margin: "2px 0", color: accent }}>{agent.agentWebsite}</p>}
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: "15px", marginBottom: "40px", pageBreakInside: "avoid" }}>
                    {[
                        { label: "Duration", value: `${itinerary.itinerary.length} Days` },
                        { label: "Budget", value: `₹${getTotalBudget(itinerary).toLocaleString()}` },
                        { label: "Activities", value: `${itinerary.itinerary.reduce((sum, d) => sum + d.timeline.length, 0)}+` },
                    ].map((stat, i) => (
                        <div key={i} style={{ flex: 1, background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                            <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "#64748b", margin: "0 0 8px 0" }}>{stat.label}</p>
                            <p style={{ fontSize: "22px", fontWeight: "bold", margin: 0, color: accent }}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Daily */}
                {itinerary.itinerary.map((day, index) => (
                    <div key={index} data-pdf-section={`day-${index}`} style={{ marginBottom: "10px", display: "block" }}>
                        {/* Day header with blended image — NO overflow:hidden */}
                        <div style={{ height: "140px", borderRadius: "16px 16px 0 0", pageBreakInside: "avoid", pageBreakAfter: "avoid", display: "block", position: "relative" }}>
                            <img src={getDayImage(day)} alt={formatTitleCase(day.areaFocus)} style={{ width: "100%", height: "140px", objectFit: "cover", filter: "brightness(0.35) saturate(0.6)", display: "block", borderRadius: "16px 16px 0 0" }} crossOrigin="anonymous" />
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 25px", zIndex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                    <div>
                                        <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px 0", color: "#f1f5f9" }}>{formatTitleCase(day.areaFocus)}</h3>
                                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Day {index + 1} • {formatDate(day.date)}</p>
                                    </div>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        {day.dailyStats?.walkingDistance && <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", background: "rgba(255,255,255,0.1)", color: "#94a3b8" }}>{formatDistance(day.dailyStats?.walkingDistance)} km</span>}
                                        {day.dailyStats?.totalCost && <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", background: `${accent}20`, color: accent }}>₹{formatCurrency(day.dailyStats?.totalCost)}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activities */}
                        <div style={{ padding: "20px 25px", background: "rgba(30, 41, 59, 0.4)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 16px 16px" }}>
                            {flights.filter(f => f.dayIndex === index).map((flight, fi) => (
                                <PdfFlightBlock key={fi} flight={flight} accentColor="#34d399" bgColor="rgba(16,185,129,0.1)" textColor="#94a3b8" />
                            ))}
                            {day.timeline.map((step, si) => (
                                <div key={si} className="pdf-no-cut" style={{ display: "flex", gap: "15px", marginBottom: si === day.timeline.length - 1 ? "0" : "15px", padding: "12px 15px", borderLeft: `3px solid ${accent}40`, borderRadius: "0 8px 8px 0", background: "rgba(255,255,255,0.02)", pageBreakInside: "avoid" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: accent, width: "70px", flexShrink: 0 }}>{step.time}</span>
                                    <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }}>{step.details}</p>
                                </div>
                            ))}
                            {hotels.filter(h => h.dayIndex === index).map((hotel, hi) => (
                                <PdfHotelBlock key={hi} hotel={hotel} accentColor="#60a5fa" bgColor="rgba(59,130,246,0.1)" textColor="#94a3b8" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div data-pdf-section="footer" style={{ padding: "30px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>Powered by GozyTrips</p>
                <p style={{ margin: 0, fontSize: "14px", color: accent, fontWeight: "bold", letterSpacing: "1px" }}>{agent.companyName}</p>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   THEME 5 — CORPORATE
   ═══════════════════════════════════════════════ */
const CorporateTheme = ({ itinerary, title, agent, hotels, flights }: ThemeProps) => {
    const navy = "#003366";
    return (
        <div style={{ fontFamily: "'Helvetica', 'Arial', sans-serif", backgroundColor: "#f4f6f8", color: "#333", width: "100%" }}>
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
                    <div style={{ width: "100%", marginBottom: "35px", fontSize: "13px", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", backgroundColor: "#f0f3f7", borderBottom: `2px solid ${navy}` }}>
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
                        {flights.filter(f => f.dayIndex === index).map((flight, fi) => (
                            <div key={`fl-${fi}`} style={{ display: "flex", borderBottom: "1px solid #eee", background: "#f0fdf4" }}>
                                <div style={{ padding: "8px 15px", flex: "0 0 100px", fontWeight: "bold", color: navy }}>✈️ {flight.departure || "–"}</div>
                                <div style={{ padding: "8px 15px", flex: 1, lineHeight: "1.5", color: "#444" }}>{flight.airline} {flight.flightNumber} — {flight.departureAirport} → {flight.arrivalAirport}{flight.pnr ? ` (PNR: ${flight.pnr})` : ''}</div>
                            </div>
                        ))}
                        {day.timeline.map((step, si) => (
                            <div key={si} className="pdf-no-cut" style={{ display: "flex", background: si % 2 === 0 ? "#ffffff" : "#fafbfc", pageBreakInside: "avoid", borderBottom: "1px solid #eee" }}>
                                <div style={{ padding: "10px 15px", flex: "0 0 100px", fontWeight: "bold", color: navy }}>{step.time}</div>
                                <div style={{ padding: "10px 15px", flex: 1, lineHeight: "1.5", color: "#444" }}>{step.details}</div>
                            </div>
                        ))}
                        {hotels.filter(h => h.dayIndex === index).map((hotel, hi) => (
                            <div key={`ht-${hi}`} style={{ display: "flex", background: "#eff6ff", borderBottom: "1px solid #eee" }}>
                                <div style={{ padding: "8px 15px", flex: "0 0 100px", fontWeight: "bold", color: navy }}>🏨 {hotel.checkIn}</div>
                                <div style={{ padding: "8px 15px", flex: 1, lineHeight: "1.5", color: "#444" }}>{hotel.name} {'★'.repeat(hotel.starRating)} — {hotel.address}{hotel.bookingRef ? ` (Ref: ${hotel.bookingRef})` : ''}</div>
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

/* ═════════ MAIN EXPORTED COMPONENT ═════════ */
export const PdfTemplate = ({ itinerary, title, userProfile, theme = 'classic', hotels = [], flights = [], pricing, baseCost }: PdfTemplateProps) => {
    if (!itinerary) return null;

    const agent = getAgentInfo(userProfile);
    const displayTitle = getSanitizedTitle(title || "", itinerary);

    let ThemeComponent;
    switch (theme) {
        case 'editorial':
            ThemeComponent = <EditorialTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} />;
            break;
        case 'minimalist':
            ThemeComponent = <MinimalistTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} />;
            break;
        case 'dark':
            ThemeComponent = <DarkTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} />;
            break;
        case 'corporate':
            ThemeComponent = <CorporateTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} />;
            break;
        case 'classic':
        default:
            ThemeComponent = <ClassicTheme itinerary={itinerary} title={displayTitle} agent={agent} hotels={hotels} flights={flights} />;
            break;
    }

    return (
        <div>
            {ThemeComponent}
            {pricing && <PdfPricingPage pricing={pricing} baseCost={baseCost} agent={agent} />}
        </div>
    );
};
