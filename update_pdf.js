const fs = require('fs');

let content = fs.readFileSync('src/components/pdf-template.tsx', 'utf-8');

// 1. Add Helper Functions
const helpers = `
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1080&auto=format&fit=crop';
const getDayImage = (day: any): string => day.imageUrl || FALLBACK_IMG;
const getCoverImage = (itinerary: TravelItineraryOutput): string => getDayImage(itinerary.itinerary[0]);

const formatTitleCase = (str: string) => {
    if (!str || typeof str !== 'string') return "";
    return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
};

const formatCurrency = (val: string | number) => {
    if (!val) return "0";
    const numMatch = String(val).match(/[\\d,.]+/);
    if (!numMatch) return "0";
    const numStr = numMatch[0].replace(/,/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? "0" : num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const formatDistance = (dist: string | number) => {
    if (!dist) return "0";
    const numMatch = String(dist).match(/[\\d.]+/);
    return numMatch ? numMatch[0] : "0";
};

const formatDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return "";
    return dateStr.replace(/^DAY\\s*\\d+/i, '').replace(/^-/, '').trim();
};

const formatMoneyWithDecimals = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPlural = (count: number, singular: string, plural: string) => {
    return \`\${count} \${count === 1 ? singular : plural}\`;
};

const getSanitizedTitle = (title: string, itinerary: TravelItineraryOutput): string => {
    let displayTitle = title || "Your Tailored Itinerary";
    if (displayTitle.toLowerCase().includes("exploration") && itinerary.itinerary.length > 0) {
        const distinctAreas = Array.from(new Set(itinerary.itinerary.map(day => day.areaFocus?.split(',')[0] || ""))).filter(Boolean);
        if (distinctAreas.length > 1) {
            displayTitle = \`Journey: \${distinctAreas[0]} to \${distinctAreas[distinctAreas.length - 1]}\`;
        }
    }
    return displayTitle;
};
`;

content = content.replace(
    /const FALLBACK_IMG[\s\S]*?getCoverImage[^;]*;/,
    helpers.trim()
);

// 2. Fix PdfFlightBlock & PdfHotelBlock margins and page breaks
content = content.replace(
    /<div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', background: bgColor, border: `1px solid \$\{accentColor\}30`, marginBottom: '8px', pageBreakInside: 'avoid' }}>/g,
    "<div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', background: bgColor, border: `1px solid ${accentColor}30`, margin: '16px 0', pageBreakInside: 'avoid', breakInside: 'avoid' }}>"
);

// 3. Fix Classic Theme Daily Structure
content = content.replace(/pageBreakBefore: index > 0 \? "always" as const : "auto" as const }}/g, 'pageBreakBefore: index > 0 ? "always" as const : "auto" as const, display: "block" }}');
content = content.replace(/pageBreakInside: "avoid", pageBreakAfter: "avoid" }}/g, 'pageBreakInside: "avoid", pageBreakAfter: "avoid", breakInside: "avoid", display: "block" }}');

content = content.replace(/\{day\.date\}/g, '{formatDate(day.date)}');
content = content.replace(/\{day\.areaFocus\}/g, '{formatTitleCase(day.areaFocus)}');
content = content.replace(/\{day\.dailyStats\?.walkingDistance \|\| "N\/A"\}/g, '{formatDistance(day.dailyStats?.walkingDistance)}');
content = content.replace(/\{day\.dailyStats\?.totalCost \|\| "N\/A"\}/g, '{formatCurrency(day.dailyStats?.totalCost)}');

content = content.replace(/\{day\.dailyStats\.walkingDistance\}/g, '{formatDistance(day.dailyStats?.walkingDistance)}');
content = content.replace(/\{day\.dailyStats\.totalCost\}/g, '{formatCurrency(day.dailyStats?.totalCost)}');

// Fix Classic Timeline bleeding
content = content.replace(
    /<div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "14px", flexShrink: 0, paddingTop: "3px" }}>([\s\S]*?)<div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#a855f7", border: "2px solid #f3e8ff", flexShrink: 0 }} \/>([\s\S]*?)\{si < day\.timeline\.length - 1 && <div style={{ width: "2px", flex: 1, background: "#e2e8f0", marginTop: "4px" }} \/>\}([\s\S]*?)<\/div>/g,
    `<div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "14px", flexShrink: 0, paddingTop: "3px", position: "relative" }}>$1<div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#a855f7", border: "2px solid #f3e8ff", flexShrink: 0, position: "relative", zIndex: 2 }} />$2{si < day.timeline.length - 1 && <div style={{ position: "absolute", top: "15px", bottom: "-18px", left: "6px", width: "2px", background: "#e2e8f0", zIndex: 1 }} />}</div>`
);

// Add breakInside to inner timeline div (Classic)
content = content.replace(
    /borderBottom: si === day\.timeline\.length - 1 \? "none" : "1px solid #f1f5f9", pageBreakInside: "avoid" }}/g,
    'borderBottom: si === day.timeline.length - 1 ? "none" : "1px solid #f1f5f9", pageBreakInside: "avoid", breakInside: "avoid" }}'
);
content = content.replace(
    /color: "#64748b", fontWeight: 500, pageBreakInside: "avoid" }}/g,
    'color: "#64748b", fontWeight: 500, pageBreakInside: "avoid", breakInside: "avoid" }}'
);

// 4. Update PdfPricingPage
content = content.replace(
    /const PdfPricingPage = \(\{ pricing, baseCost = 0, agent \}: \{ pricing: PricingConfig; baseCost\?: number; agent: ReturnType<typeof getAgentInfo> \}\) => \{[\s\S]*?\};/g,
    `const PdfPricingPage = ({ pricing, baseCost = 0, agent }: { pricing: PricingConfig; baseCost?: number; agent: ReturnType<typeof getAgentInfo> }) => {
    const markupAmount = pricing.markupType === "percentage"
        ? (baseCost * pricing.markupValue) / 100
        : pricing.markupValue;
    const costWithMarkup = baseCost + markupAmount;
    const taxAmount = (costWithMarkup * pricing.taxPercentage) / 100;
    const finalTotal = costWithMarkup + taxAmount;
    const currency = pricing.currency;

    return (
        <div style={{ padding: "60px 50px", fontFamily: "'Inter', sans-serif", pageBreakBefore: "always", color: "#1e293b", backgroundColor: "#ffffff" }}>
            <h2 style={{ fontSize: "28px", color: agent.primaryColor, marginBottom: "30px", borderBottom: \`2px solid \${agent.primaryColor}\`, paddingBottom: "15px" }}>
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
                        Pricing is valid for the specified dates and {formatPlural(pricing.adultPax, 'Adult', 'Adults')}{pricing.childPax > 0 ? \`, \${formatPlural(pricing.childPax, 'Child', 'Children')}\` : ''}{pricing.infantPax > 0 ? \`, \${formatPlural(pricing.infantPax, 'Infant', 'Infants')}\` : ''} only.
                    </div>
                </div>
            </div>

            {pricing.milestones && pricing.milestones.length > 0 && (
                <div style={{ pageBreakInside: "avoid" }}>
                    <h3 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "20px", fontWeight: "bold" }}>Payment Schedule</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", tableLayout: "fixed" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f1f5f9" }}>
                                <th style={{ padding: "12px 15px", textAlign: "left", color: "#475569", borderBottom: "2px solid #cbd5e1", width: "40%" }}>Milestone</th>
                                <th style={{ padding: "12px 15px", textAlign: "left", color: "#475569", borderBottom: "2px solid #cbd5e1", width: "40%" }}>Timeline / Due Date</th>
                                <th style={{ padding: "12px 15px", textAlign: "right", color: "#475569", borderBottom: "2px solid #cbd5e1", width: "20%" }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pricing.milestones.map((m, i) => {
                                const amount = (finalTotal * m.percentage) / 100;
                                return (
                                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                        <td style={{ padding: "15px", color: "#0f172a", fontWeight: 500, verticalAlign: "top" }}>{m.name} ({m.percentage}%)</td>
                                        <td style={{ padding: "15px", color: "#64748b", verticalAlign: "top" }}>{m.dueDate}</td>
                                        <td style={{ padding: "15px", textAlign: "right", color: "#0f172a", fontWeight: "bold", verticalAlign: "top" }}>{currency} {formatMoneyWithDecimals(amount)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};`
);

// 5. Update displayTitle in PdfTemplate
content = content.replace(
    /const displayTitle = title \|\| "Your Tailored Itinerary";/g,
    'const displayTitle = getSanitizedTitle(title || "", itinerary);'
);

fs.writeFileSync('src/components/pdf-template.tsx', content);
console.log('Successfully updated pdf-template.tsx');
