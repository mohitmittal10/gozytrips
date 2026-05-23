import React from 'react';
import type { ThemeProps } from './classic-theme';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { formatCurrency } from '@/lib/utils/currency';
import { getTotalBudget, getCoverImage, getDayImage, formatTitleCase, formatDate } from '../utils';
import { PdfDaywiseIndex } from '../pages';

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

export const DesertFooter = ({ agent }: { agent: ThemeProps["agent"] }) => (
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
            </div>
        </div>
    </section>
);

export const DesertTheme = ({ itinerary, title, agent, finalTotal = 0, daySummaries }: ThemeProps) => {
    const days = itinerary.itinerary?.length || 0;
    const nights = getNightsLabel(days);
    const currency = (itinerary as any).pricing?.currency || DEFAULT_CURRENCY;
    const totalBudget = formatCurrency(finalTotal || getTotalBudget(itinerary), currency);
    const destination = getPrimaryDestination(itinerary);
    const heroDescription = getHeroDescription(itinerary);
    const agencyDetails = getAgencyDetails(agent);

    return (
        <div style={{ fontFamily: "'Noto Serif', 'Georgia', serif", backgroundColor: "#fdfcfb", color: "#131314", width: "100%" }}>
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
        </div>
    );
};
