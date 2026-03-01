import React from 'react';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';

export type PdfTheme = 'classic' | 'editorial' | 'minimalist' | 'dark' | 'corporate';

export interface PdfTemplateProps {
    itinerary: TravelItineraryOutput | null | undefined;
    title?: string;
    userProfile?: any;
    theme?: PdfTheme;
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

/* ═══════════════════════════════════════════════
   THEME 1 — CLASSIC
   Hero gradient overlay → stat cards → timeline dots
   ═══════════════════════════════════════════════ */
const ClassicTheme = ({ itinerary, title, agent }: { itinerary: TravelItineraryOutput; title: string; agent: ReturnType<typeof getAgentInfo> }) => (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#ffffff", color: "#1e293b", width: "100%", position: "relative", minHeight: "100vh", overflow: "hidden" }}>
        {/* Diagonal watermark */}
        {agent.companyName && (
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-45deg)", fontSize: "120px", color: "rgba(0,0,0,0.03)", fontWeight: "bold", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 0, textTransform: "uppercase", letterSpacing: "8px" }}>
                {agent.companyName}
            </div>
        )}

        <div style={{ position: "relative", zIndex: 1 }}>
            {/* Hero with gradient overlay */}
            <div style={{ position: "relative", height: "280px", borderRadius: "16px 16px 0 0", overflow: "hidden", marginBottom: "30px" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center", zIndex: 1 }} />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to right, rgba(168,85,247,0.8), rgba(236,72,153,0.8))", zIndex: 2 }} />
                <div style={{ position: "absolute", bottom: "40px", left: "40px", zIndex: 3, color: "white" }}>
                    <h1 style={{ fontSize: "44px", fontWeight: "bold", margin: "0 0 10px 0", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>{title}</h1>
                    <p style={{ fontSize: "18px", opacity: 0.95, margin: 0, fontWeight: 500 }}>Prepared for your upcoming journey.</p>
                </div>
            </div>

            <div style={{ padding: "0 40px" }}>
                {/* Agent details */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "25px", marginBottom: "30px" }}>
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
                <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
                    <div style={{ flex: 1, background: "#f8fafc", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", borderLeft: "4px solid #a855f7" }}>
                        <h3 style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Duration</h3>
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>{itinerary.itinerary.length} Days</p>
                    </div>
                    <div style={{ flex: 1, background: "#f8fafc", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", borderLeft: "4px solid #ec4899" }}>
                        <h3 style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Total Budget</h3>
                        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>₹{getTotalBudget(itinerary).toLocaleString()}</p>
                    </div>
                </div>

                {/* Daily itineraries — timeline layout */}
                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    {itinerary.itinerary.map((day, index) => (
                        <div key={index} style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", pageBreakInside: "avoid", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                            <div style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)", padding: "20px 25px", color: "white" }}>
                                <span style={{ fontSize: "14px", opacity: 0.9, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Day {index + 1} • {day.date}</span>
                                <h3 style={{ margin: "5px 0 0 0", fontSize: "22px", fontWeight: "bold" }}>{day.areaFocus}</h3>
                            </div>
                            <div style={{ padding: "25px", position: "relative" }}>
                                <div style={{ position: "absolute", left: "35px", top: "25px", bottom: "25px", width: "2px", background: "#e2e8f0", zIndex: 0 }} />
                                {day.timeline.map((step, si) => (
                                    <div key={si} style={{ position: "relative", paddingLeft: "40px", marginBottom: si === day.timeline.length - 1 ? "0" : "25px", zIndex: 1 }}>
                                        <div style={{ position: "absolute", left: "5px", top: "2px", width: "12px", height: "12px", borderRadius: "50%", background: "#a855f7", border: "3px solid white", boxShadow: "0 0 0 2px #f8fafc" }} />
                                        <span style={{ fontWeight: "bold", color: "#a855f7", fontSize: "14px", background: "#f3e8ff", padding: "4px 8px", borderRadius: "20px" }}>{step.time}</span>
                                        <p style={{ margin: "8px 0 0 0", fontSize: "14px", lineHeight: "1.6", color: "#475569" }}>{step.details}</p>
                                    </div>
                                ))}
                                <div style={{ marginTop: "25px", paddingTop: "20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "20px", fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
                                    <div>🏃‍♂️ Distance: {day.dailyStats?.walkingDistance || "N/A"} km</div>
                                    <div>💰 Budget: ₹{day.dailyStats?.totalCost || "N/A"}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: "50px", padding: "30px 40px", background: "#0f172a", color: "white", textAlign: "center", borderRadius: "0 0 16px 16px" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px", background: "linear-gradient(to right, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{agent.companyName}</div>
                <p style={{ margin: "0 0 5px 0", color: "#94a3b8", fontSize: "14px" }}>Your Personal AI Travel Architect</p>
                <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>Generated on: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    </div>
);

/* ═══════════════════════════════════════════════
   THEME 2 — EDITORIAL (Magazine / Luxury Brochure)
   Full-bleed photo, serif type, gold accents,
   two-column spread, pull-quotes, no timeline dots
   ═══════════════════════════════════════════════ */
const EditorialTheme = ({ itinerary, title, agent }: { itinerary: TravelItineraryOutput; title: string; agent: ReturnType<typeof getAgentInfo> }) => {
    const gold = "#b8860b";
    const lightGold = "#f5f0e3";
    return (
        <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", backgroundColor: "#ffffff", color: "#2c2c2c", width: "100%", minHeight: "100vh" }}>
            {/* Full-bleed cover photo — no overlay, photo speaks for itself */}
            <div style={{ position: "relative", height: "480px", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                <div style={{ position: "absolute", bottom: "50px", left: "60px", right: "60px", color: "white", zIndex: 2 }}>
                    <p style={{ fontSize: "14px", letterSpacing: "4px", textTransform: "uppercase", margin: "0 0 15px 0", color: gold, fontFamily: "'Helvetica Neue', sans-serif" }}>{agent.companyName}</p>
                    <h1 style={{ fontSize: "52px", fontWeight: "normal", margin: "0 0 15px 0", lineHeight: "1.1", fontStyle: "italic" }}>{title}</h1>
                    <div style={{ width: "60px", height: "2px", background: gold, marginBottom: "15px" }} />
                    <p style={{ fontSize: "16px", opacity: 0.85, margin: 0, fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 300 }}>{itinerary.itinerary.length}-Day Journey • Curated by {agent.agentName}</p>
                </div>
            </div>

            <div style={{ padding: "50px 60px" }}>
                {/* Agent info — two-column elegant layout */}
                <div style={{ display: "flex", gap: "60px", marginBottom: "50px", borderBottom: `1px solid ${gold}`, paddingBottom: "40px" }}>
                    <div style={{ flex: 2 }}>
                        {agent.agentBio && (
                            <blockquote style={{ fontSize: "20px", lineHeight: "1.8", color: "#555", fontStyle: "italic", margin: 0, borderLeft: "none", padding: 0 }}>
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

                {/* Trip overview — magazine-style metric strip */}
                <div style={{ display: "flex", justifyContent: "center", gap: "80px", marginBottom: "60px", textAlign: "center" }}>
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
                        <p style={{ fontSize: "36px", fontWeight: "normal", color: gold, margin: "0 0 5px 0", fontStyle: "italic" }}>{itinerary.itinerary.length > 0 ? itinerary.itinerary[0].timeline.length : 0}+</p>
                        <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "3px", color: "#999", fontFamily: "'Helvetica Neue', sans-serif", margin: 0 }}>Experiences</p>
                    </div>
                </div>

                {/* Daily layout — editorial two-column: big date on left, flowing prose on right */}
                {itinerary.itinerary.map((day, index) => (
                    <div key={index} style={{ display: "flex", gap: "40px", marginBottom: "50px", paddingBottom: "50px", borderBottom: "1px solid #eee", pageBreakInside: "avoid" }}>
                        {/* Left column — large day number + date */}
                        <div style={{ width: "120px", flexShrink: 0, textAlign: "center", paddingTop: "5px" }}>
                            <p style={{ fontSize: "72px", fontWeight: "normal", color: gold, margin: "0", lineHeight: "1", fontStyle: "italic" }}>{String(index + 1).padStart(2, '0')}</p>
                            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "#999", margin: "10px 0 0 0", fontFamily: "'Helvetica Neue', sans-serif" }}>{day.date}</p>
                            <div style={{ width: "30px", height: "1px", background: gold, margin: "15px auto 0 auto" }} />
                        </div>

                        {/* Right column — area focus + flowing activity descriptions */}
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: "26px", fontWeight: "normal", color: "#333", margin: "0 0 5px 0", fontStyle: "italic" }}>{day.areaFocus}</h3>
                            <p style={{ fontSize: "12px", color: "#999", margin: "0 0 25px 0", fontFamily: "'Helvetica Neue', sans-serif", textTransform: "uppercase", letterSpacing: "2px" }}>
                                {day.dailyStats?.walkingDistance && `${day.dailyStats.walkingDistance} km`}{day.dailyStats?.totalCost && ` • ₹${day.dailyStats.totalCost}`}
                            </p>

                            {day.timeline.map((step, si) => (
                                <div key={si} style={{ marginBottom: "20px" }}>
                                    <p style={{ fontSize: "13px", color: gold, fontWeight: "bold", margin: "0 0 6px 0", fontFamily: "'Helvetica Neue', sans-serif", letterSpacing: "1px" }}>{step.time}</p>
                                    <p style={{ fontSize: "15px", lineHeight: "1.8", color: "#444", margin: 0 }}>{step.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Elegant footer */}
            <div style={{ padding: "40px 60px", borderTop: `2px solid ${gold}`, textAlign: "center" }}>
                <p style={{ fontSize: "14px", letterSpacing: "4px", textTransform: "uppercase", color: gold, margin: "0 0 8px 0" }}>{agent.companyName}</p>
                <p style={{ fontSize: "12px", color: "#999", margin: 0, fontFamily: "'Helvetica Neue', sans-serif" }}>Generated on {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   THEME 3 — MINIMALIST
   No hero image, bold geometric typography,
   clean numbered list, monochrome + single accent,
   lots of whitespace, data-first
   ═══════════════════════════════════════════════ */
const MinimalistTheme = ({ itinerary, title, agent }: { itinerary: TravelItineraryOutput; title: string; agent: ReturnType<typeof getAgentInfo> }) => {
    const accent = agent.primaryColor || "#000000";
    return (
        <div style={{ fontFamily: "'Helvetica Neue', 'Arial', sans-serif", backgroundColor: "#ffffff", color: "#111", width: "100%", minHeight: "100vh", padding: "60px" }}>
            {/* Typographic header — bold black block */}
            <div style={{ marginBottom: "60px" }}>
                <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "5px", color: "#999", margin: "0 0 20px 0" }}>{agent.companyName} / {agent.agentName}</p>
                <h1 style={{ fontSize: "48px", fontWeight: 900, margin: "0 0 15px 0", lineHeight: "1.1", textTransform: "uppercase", letterSpacing: "-1px" }}>{title}</h1>
                <div style={{ width: "60px", height: "4px", background: accent, marginBottom: "20px" }} />
                <p style={{ fontSize: "14px", color: "#666", margin: 0, maxWidth: "500px", lineHeight: "1.6" }}>
                    {itinerary.itinerary.length} days • ₹{getTotalBudget(itinerary).toLocaleString()} estimated budget
                </p>
            </div>

            {/* Contact — inline horizontal strip */}
            <div style={{ display: "flex", gap: "30px", marginBottom: "60px", paddingBottom: "30px", borderBottom: "1px solid #eee", fontSize: "12px", color: "#888" }}>
                {agent.agentPhone && <span>{agent.agentPhone}</span>}
                {agent.agentEmail && <span>{agent.agentEmail}</span>}
                {agent.agentWebsite && <span style={{ color: accent }}>{agent.agentWebsite}</span>}
            </div>

            {/* Agent bio — minimal pull quote */}
            {agent.agentBio && (
                <div style={{ margin: "0 0 50px 0", padding: "0 0 0 20px", borderLeft: `3px solid ${accent}`, maxWidth: "600px" }}>
                    <p style={{ fontSize: "14px", lineHeight: "1.8", color: "#555", margin: 0, fontStyle: "italic" }}>{agent.agentBio}</p>
                </div>
            )}

            {/* Daily itineraries — clean numbered sections */}
            {itinerary.itinerary.map((day, index) => (
                <div key={index} style={{ marginBottom: "50px", pageBreakInside: "avoid" }}>
                    {/* Day header — number + title inline */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: "15px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "32px", fontWeight: 900, color: accent }}>{String(index + 1).padStart(2, '0')}</span>
                        <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>{day.areaFocus}</h3>
                    </div>
                    <div style={{ display: "flex", gap: "20px", marginBottom: "20px", fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "2px" }}>
                        <span>{day.date}</span>
                        {day.dailyStats?.walkingDistance && <span>{day.dailyStats.walkingDistance} km walk</span>}
                        {day.dailyStats?.totalCost && <span>₹{day.dailyStats.totalCost}</span>}
                    </div>

                    {/* Activities — simple table-like rows */}
                    <div style={{ borderTop: "1px solid #eee" }}>
                        {day.timeline.map((step, si) => (
                            <div key={si} style={{ display: "flex", gap: "20px", padding: "14px 0", borderBottom: "1px solid #f5f5f5" }}>
                                <div style={{ width: "80px", flexShrink: 0, fontSize: "13px", fontWeight: 700, color: accent }}>{step.time}</div>
                                <p style={{ flex: 1, margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#444" }}>{step.details}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Footer — minimal */}
            <div style={{ marginTop: "60px", paddingTop: "20px", borderTop: "1px solid #ddd", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#bbb", textTransform: "uppercase", letterSpacing: "2px" }}>
                <span>{agent.companyName}</span>
                <span>{new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   THEME 4 — DARK MODE (Premium)
   Dark slate background, glassmorphism cards,
   neon accent glow, badge-style stats,
   horizontal rule separators instead of dots
   ═══════════════════════════════════════════════ */
const DarkTheme = ({ itinerary, title, agent }: { itinerary: TravelItineraryOutput; title: string; agent: ReturnType<typeof getAgentInfo> }) => {
    const accent = agent.primaryColor || "#a855f7";
    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#0a0e1a", color: "#e2e8f0", width: "100%", minHeight: "100vh" }}>
            {/* Dark hero with subtle glow */}
            <div style={{ position: "relative", height: "300px", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.3) saturate(0.5)" }} />
                {/* Accent glow */}
                <div style={{ position: "absolute", top: "50%", left: "30%", width: "300px", height: "300px", background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`, transform: "translate(-50%, -50%)", zIndex: 1 }} />
                <div style={{ position: "absolute", bottom: "40px", left: "40px", zIndex: 2 }}>
                    <p style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: accent, margin: "0 0 12px 0" }}>{agent.companyName}</p>
                    <h1 style={{ fontSize: "40px", fontWeight: "bold", margin: "0 0 8px 0", color: "#ffffff" }}>{title}</h1>
                    <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>Crafted by {agent.agentName}</p>
                </div>
            </div>

            <div style={{ padding: "40px" }}>
                {/* Agent info — glass card */}
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

                {/* Stats — badge row */}
                <div style={{ display: "flex", gap: "15px", marginBottom: "40px" }}>
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

                {/* Daily itineraries — glass cards with accent-bordered activities */}
                {itinerary.itinerary.map((day, index) => (
                    <div key={index} style={{ background: "rgba(30, 41, 59, 0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", marginBottom: "25px", overflow: "hidden", pageBreakInside: "avoid" }}>
                        {/* Day header — horizontal with accent line */}
                        <div style={{ padding: "20px 25px", borderBottom: `1px solid rgba(255,255,255,0.06)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px 0", color: "#f1f5f9" }}>{day.areaFocus}</h3>
                                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Day {index + 1} • {day.date}</p>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                {day.dailyStats?.walkingDistance && (
                                    <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>{day.dailyStats.walkingDistance} km</span>
                                )}
                                {day.dailyStats?.totalCost && (
                                    <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", background: `${accent}20`, color: accent }}>₹{day.dailyStats.totalCost}</span>
                                )}
                            </div>
                        </div>

                        {/* Activities — left border accent style, no timeline dots */}
                        <div style={{ padding: "20px 25px" }}>
                            {day.timeline.map((step, si) => (
                                <div key={si} style={{ display: "flex", gap: "15px", marginBottom: si === day.timeline.length - 1 ? "0" : "15px", padding: "12px 15px", borderLeft: `3px solid ${accent}40`, borderRadius: "0 8px 8px 0", background: "rgba(255,255,255,0.02)" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: accent, width: "70px", flexShrink: 0 }}>{step.time}</span>
                                    <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }}>{step.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "30px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>Powered by GozyTrips</p>
                <p style={{ margin: 0, fontSize: "14px", color: accent, fontWeight: "bold", letterSpacing: "1px" }}>{agent.companyName}</p>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   THEME 5 — CORPORATE
   No hero photo, formal letterhead header,
   data tables for schedule, information-dense,
   conservative navy/gray palette
   ═══════════════════════════════════════════════ */
const CorporateTheme = ({ itinerary, title, agent }: { itinerary: TravelItineraryOutput; title: string; agent: ReturnType<typeof getAgentInfo> }) => {
    const navy = "#003366";
    return (
        <div style={{ fontFamily: "'Helvetica', 'Arial', sans-serif", backgroundColor: "#ffffff", color: "#333", width: "100%", minHeight: "100vh" }}>
            {/* Formal letterhead — no image, clean top band */}
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
                {/* Document title block */}
                <div style={{ marginBottom: "30px", paddingBottom: "20px", borderBottom: `3px solid ${navy}` }}>
                    <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 8px 0", color: navy }}>{title}</h2>
                    <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>Document generated on {new Date().toLocaleDateString()} • {itinerary.itinerary.length}-day itinerary</p>
                </div>

                {/* Bio / greeting */}
                {agent.agentBio && (
                    <div style={{ background: "#f7f9fc", border: "1px solid #e0e6ed", borderRadius: "4px", padding: "15px 20px", marginBottom: "30px", fontSize: "13px", color: "#555", lineHeight: "1.7" }}>
                        {agent.agentBio}
                    </div>
                )}

                {/* Summary table */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "35px", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ background: "#f0f3f7" }}>
                            <th style={{ padding: "10px 15px", textAlign: "left", borderBottom: `2px solid ${navy}`, color: navy, textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px" }}>Metric</th>
                            <th style={{ padding: "10px 15px", textAlign: "left", borderBottom: `2px solid ${navy}`, color: navy, textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px" }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style={{ padding: "10px 15px", borderBottom: "1px solid #eee" }}>Total Duration</td><td style={{ padding: "10px 15px", borderBottom: "1px solid #eee", fontWeight: "bold" }}>{itinerary.itinerary.length} Days</td></tr>
                        <tr><td style={{ padding: "10px 15px", borderBottom: "1px solid #eee" }}>Estimated Budget</td><td style={{ padding: "10px 15px", borderBottom: "1px solid #eee", fontWeight: "bold" }}>₹{getTotalBudget(itinerary).toLocaleString()}</td></tr>
                        <tr><td style={{ padding: "10px 15px", borderBottom: "1px solid #eee" }}>Total Activities</td><td style={{ padding: "10px 15px", borderBottom: "1px solid #eee", fontWeight: "bold" }}>{itinerary.itinerary.reduce((s, d) => s + d.timeline.length, 0)}</td></tr>
                        {agent.agentWebsite && <tr><td style={{ padding: "10px 15px", borderBottom: "1px solid #eee" }}>Website</td><td style={{ padding: "10px 15px", borderBottom: "1px solid #eee", color: navy }}>{agent.agentWebsite}</td></tr>}
                    </tbody>
                </table>

                {/* Daily itineraries — table-based schedule */}
                {itinerary.itinerary.map((day, index) => (
                    <div key={index} style={{ marginBottom: "30px", pageBreakInside: "avoid" }}>
                        <div style={{ background: navy, color: "white", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ fontSize: "15px", margin: 0, fontWeight: "bold" }}>Day {index + 1}: {day.areaFocus}</h3>
                            <span style={{ fontSize: "12px", opacity: 0.8 }}>{day.date}</span>
                        </div>

                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ background: "#f7f9fc" }}>
                                    <th style={{ padding: "8px 15px", textAlign: "left", borderBottom: "1px solid #ddd", width: "100px", color: "#555", fontSize: "11px", textTransform: "uppercase" }}>Time</th>
                                    <th style={{ padding: "8px 15px", textAlign: "left", borderBottom: "1px solid #ddd", color: "#555", fontSize: "11px", textTransform: "uppercase" }}>Activity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {day.timeline.map((step, si) => (
                                    <tr key={si} style={{ background: si % 2 === 0 ? "#ffffff" : "#fafbfc" }}>
                                        <td style={{ padding: "10px 15px", borderBottom: "1px solid #eee", fontWeight: "bold", color: navy, verticalAlign: "top" }}>{step.time}</td>
                                        <td style={{ padding: "10px 15px", borderBottom: "1px solid #eee", lineHeight: "1.5", color: "#444" }}>{step.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Day stats footer */}
                        <div style={{ display: "flex", gap: "30px", padding: "8px 15px", background: "#f7f9fc", borderBottom: "1px solid #ddd", fontSize: "12px", color: "#666" }}>
                            {day.dailyStats?.walkingDistance && <span>Walking: {day.dailyStats.walkingDistance} km</span>}
                            {day.dailyStats?.totalCost && <span>Est. Cost: ₹{day.dailyStats.totalCost}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Corporate footer */}
            <div style={{ padding: "20px 50px", borderTop: `2px solid ${navy}`, display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#999" }}>
                <span>Confidential — Prepared by {agent.companyName}</span>
                <span>Page generated: {new Date().toLocaleDateString()}</span>
            </div>
        </div>
    );
};

/* ═════════ MAIN EXPORTED COMPONENT ═════════ */
export const PdfTemplate = ({ itinerary, title, userProfile, theme = 'classic' }: PdfTemplateProps) => {
    if (!itinerary) return null;

    const agent = getAgentInfo(userProfile);
    const displayTitle = title || "Your Tailored Itinerary";

    switch (theme) {
        case 'editorial':
            return <EditorialTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
        case 'minimalist':
            return <MinimalistTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
        case 'dark':
            return <DarkTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
        case 'corporate':
            return <CorporateTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
        case 'classic':
        default:
            return <ClassicTheme itinerary={itinerary} title={displayTitle} agent={agent} />;
    }
};
