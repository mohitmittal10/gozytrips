"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { PdfTemplate } from "@/components/pdf-template";
import type { PdfTheme } from "@/components/pdf/theme-config";
import { DEFAULT_PDF_THEME_OPTIONS } from "@/components/pdf/theme-config";
import { getAgentInfo } from "@/components/pdf/utils";
import { calcPricingFromBaseCost, calcBaseCost, extractTripCost } from "@/services/financial";
import { defaultPricingConfig } from "@/types/pricing";
import { filterCompleteEntriesForExport } from "@/lib/validation/logistics-validation";

// ─────────────────────────────────────────────────────────────
// Toolbar: save / editing state
// ─────────────────────────────────────────────────────────────
function EditorToolbar({
    saving,
    saved,
    dirty,
    onSave,
    onToggleEdit,
    editMode,
    itineraryTitle,
    onBack,
    selectedTheme,
    onThemeChange,
}: {
    saving: boolean;
    saved: boolean;
    dirty: boolean;
    onSave: () => void;
    onToggleEdit: () => void;
    editMode: boolean;
    itineraryTitle: string;
    onBack: () => void;
    selectedTheme: PdfTheme;
    onThemeChange: (theme: PdfTheme) => void;
}) {
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                background: "rgba(9,9,11,0.97)",
                borderBottom: "1px solid #27272a",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                height: 56,
                fontFamily: "var(--font-sans, sans-serif)",
                gap: 16,
            }}
        >
            {/* Left: back + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                <button
                    onClick={onBack}
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#e4e4e7",
                        cursor: "pointer",
                        padding: "5px 12px",
                        fontSize: 12,
                        borderRadius: "8px",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s",
                    }}
                >
                    ← Back
                </button>
                <span
                    style={{
                        color: "#71717A",
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {itineraryTitle || "Itinerary Editor"}
                </span>
            </div>

            {/* Center: mode indicator */}
            <div
                style={{
                    fontSize: 11,
                    letterSpacing: "1px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: editMode ? "#e4e4e7" : "#71717A",
                    transition: "color 0.2s",
                }}
            >
                {editMode ? "✏ Edit Mode" : "Preview Mode"}
            </div>

            {/* Right: controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Theme selector */}
                <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: "#71717A",
                    letterSpacing: "0.5px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                }}>
                    Theme
                    <select
                        value={selectedTheme}
                        onChange={(e) => onThemeChange(e.target.value as PdfTheme)}
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#e4e4e7",
                            cursor: "pointer",
                            padding: "5px 10px",
                            fontSize: 11,
                            borderRadius: "8px",
                            fontWeight: 600,
                            outline: "none",
                        }}
                    >
                        {DEFAULT_PDF_THEME_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}
                                style={{ background: "#18181b", color: "#e4e4e7" }}
                            >
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    onClick={onToggleEdit}
                    style={{
                        background: editMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${editMode ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"}`,
                        color: "#e4e4e7",
                        cursor: "pointer",
                        padding: "5px 14px",
                        fontSize: 12,
                        borderRadius: "8px",
                        fontWeight: 600,
                        transition: "all 0.2s",
                    }}
                >
                    {editMode ? "Done Editing" : "Edit Content"}
                </button>
                {dirty && (
                    <button
                        onClick={onSave}
                        disabled={saving}
                        style={{
                            background: saving ? "rgba(228,228,231,0.5)" : "#e4e4e7",
                            border: "none",
                            color: "#09090b",
                            cursor: saving ? "not-allowed" : "pointer",
                            padding: "5px 18px",
                            fontSize: 12,
                            borderRadius: "8px",
                            fontWeight: 700,
                            transition: "all 0.2s",
                        }}
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                )}
                {saved && !dirty && (
                    <span
                        style={{
                            fontSize: 12,
                            color: "#71717A",
                            fontWeight: 600,
                        }}
                    >
                        ✓ Saved
                    </span>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// instrumentTheme: stamps data-field on any rendered theme's DOM
// so the contenteditable editing system works universally.
// ─────────────────────────────────────────────────────────────
function instrumentTheme(container: HTMLDivElement, liveData: any) {
    // Skip if this theme already has native data-field support (LuxuryTheme)
    const alreadyInstrumented = container.querySelectorAll("[data-field]").length > 5;
    if (alreadyInstrumented) return;

    // Helper: stamp a data-field on an element only if not already set
    const stamp = (el: Element | null, field: string) => {
        if (el && !el.getAttribute("data-field")) {
            el.setAttribute("data-field", field);
        }
    };

    // — Cover: trip title
    const cover = container.querySelector("[data-pdf-section='cover']");
    if (cover) {
        // Try h1 first, then first h2
        const titleEl = cover.querySelector("h1") || cover.querySelector("h2");
        stamp(titleEl, "itinerary.title");
    }

    // — Days: location header + activity lines
    const days = liveData?.itinerary || [];
    days.forEach((_day: any, idx: number) => {
        const daySection = container.querySelector(`[data-pdf-section='day-${idx}']`);
        if (!daySection) return;

        // Day location/title — first h3 or h4 in the day section
        const dayTitle = daySection.querySelector("h3") ||
            daySection.querySelector("h4") ||
            daySection.querySelector("h2");
        stamp(dayTitle, `days[${idx}].location`);

        // Activities — each <p> or <li> after the header is an activity
        const activityEls = Array.from(
            daySection.querySelectorAll("p, li")
        ).filter(el => {
            // Exclude timestamp/time elements (short, uppercase, time-like)
            const text = (el as HTMLElement).innerText?.trim() || "";
            return text.length > 4 && !text.match(/^\d{1,2}:\d{2}/) && !text.match(/^Day \d/);
        });
        activityEls.forEach((el, aIdx) => {
            stamp(el, `days[${idx}].activities[${aIdx}]`);
        });
    });

    // — Inclusions section: each <li> or <p> or <span> with text
    const inclusionsSection = container.querySelector("[data-pdf-section='inclusions']");
    if (inclusionsSection) {
        // Typically two columns: inclusions first, then exclusions
        const allItems = Array.from(inclusionsSection.querySelectorAll("li, span, p")).filter(el => {
            const text = (el as HTMLElement).innerText?.trim() || "";
            return text.length > 2 && !(el as HTMLElement).querySelector("li, span, p");
        });

        // Split roughly in half: first half = inclusions, second half = exclusions
        const incCount = liveData?.inclusions
            ? (liveData.inclusions.split("\n").filter(Boolean).length)
            : Math.ceil(allItems.length / 2);

        allItems.forEach((el, i) => {
            if (i < incCount) {
                stamp(el, `inclusions[${i}]`);
            } else {
                stamp(el, `exclusions[${i - incCount}]`);
            }
        });
    }

    // — Terms section (if exists separately)
    const termsSection = container.querySelector("[data-pdf-section='terms']");
    if (termsSection) {
        const allItems = Array.from(termsSection.querySelectorAll("li, p, div")).filter(el => {
            const text = (el as HTMLElement).innerText?.trim() || "";
            return text.length > 4 && !(el as HTMLElement).querySelector("li, p");
        });
        allItems.forEach((el, i) => stamp(el, `terms[${i}]`));
    }
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function LuxuryEditorPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, agencySettings, userProfile } = useAuth();
    const supabase = createClient();

    const [itinerary, setItinerary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<PdfTheme>(
        ((agencySettings as any)?.default_pdf_theme as PdfTheme) || 'luxury'
    );

    // We hold mutated itinerary_data separately so we can track changes
    const [liveData, setLiveData] = useState<any>(null);
    const liveDataRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Keep liveDataRef in sync with liveData state
    useEffect(() => { liveDataRef.current = liveData; }, [liveData]);

    const fetchedRef = useRef(false);

    // ── Fetch itinerary from Supabase ──────────────────────────
    useEffect(() => {
        if (!id || !user?.id) return;
        if (fetchedRef.current && itinerary?.id === id) return;

        let isSubscribed = true;
        const fetchItinerary = async () => {
            if (!itinerary) setLoading(true);
            const { data, error } = await supabase
                .from("itineraries")
                .select("*")
                .eq("id", id)
                .eq("user_id", user.id)
                .single();
            if (!isSubscribed) return;
            if (error || !data) {
                if (!itinerary) setError(error?.message || "Itinerary not found");
            } else {
                setItinerary(data);
                setLiveData((prev: any) => prev ? prev : data.itinerary_data);
                // Restore saved theme from itinerary_data or fall back to user default
                const savedTheme = data.itinerary_data?.selectedTheme as PdfTheme | undefined;
                if (savedTheme) setSelectedTheme(savedTheme);
                fetchedRef.current = true;
            }
            setLoading(false);
        };
        fetchItinerary();
        return () => { isSubscribed = false; };
    }, [id, user?.id]);

    // ── Instrument DOM with data-field after any theme renders ─────────
    useEffect(() => {
        if (!containerRef.current || !liveData) return;
        // Small delay to let React flush the theme render
        const timer = setTimeout(() => {
            if (containerRef.current) {
                instrumentTheme(containerRef.current, liveData);
            }
        }, 80);
        return () => clearTimeout(timer);
    }, [liveData, selectedTheme]);

    // ── Toggle edit: make fields contenteditable ──────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        // Re-instrument synchronously when entering edit mode (handles theme switches)
        if (editMode && liveDataRef.current) instrumentTheme(containerRef.current, liveDataRef.current);
        const fields = containerRef.current.querySelectorAll("[data-field]");
        fields.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (editMode) {
                if (htmlEl.contentEditable !== "true") {
                    htmlEl.contentEditable = "true";
                    // White outer ring + blue inner ring = visible on any theme background
                    htmlEl.style.outline = "none";
                    htmlEl.style.boxShadow = "0 0 0 2px #ffffff, 0 0 0 4px #3b82f6";
                    htmlEl.style.outlineOffset = "";
                    htmlEl.style.cursor = "text";
                    htmlEl.style.borderRadius = "3px";
                }
            } else {
                if (htmlEl.contentEditable !== "false") {
                    htmlEl.contentEditable = "false";
                    htmlEl.style.outline = "";
                    htmlEl.style.boxShadow = "";
                    htmlEl.style.outlineOffset = "";
                    htmlEl.style.cursor = "";
                    htmlEl.style.borderRadius = "";
                }
            }
        });
    }, [editMode]);

    // ── Track changes from contenteditable ─────────────────────
    const handleContentChange = useCallback(() => {
        if (!editMode) return;
        setDirty(true);
        setSaved(false);
    }, [editMode]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener("input", handleContentChange);
        return () => container.removeEventListener("input", handleContentChange);
    }, [handleContentChange]);

    // ── Collect all edited content from DOM and merge into data ─
    const collectEdits = useCallback((): any => {
        if (!containerRef.current || !liveData) return liveData;
        const fields = containerRef.current.querySelectorAll("[data-field]");

        // Deep-clone liveData
        const newData = JSON.parse(JSON.stringify(liveData));
        if (!newData.agencyOverrides) newData.agencyOverrides = {};
        if (!newData.consultant) newData.consultant = {};
        if (!newData.bookingDetails) newData.bookingDetails = {};
        if (!newData.aboutPlace) newData.aboutPlace = {};
        if (!newData.bankDetails || typeof newData.bankDetails !== "object") {
            newData.bankDetails = typeof newData.bankDetails === "object" ? { ...newData.bankDetails } : {};
        }

        const inclusionsArr: string[] = [];
        const exclusionsArr: string[] = [];
        const termsArr: string[] = [];
        const conditionsArr: string[] = [];
        const cancelArr: string[] = [];
        const highlightsArr: string[] = [];

        fields.forEach((el) => {
            const path = (el as HTMLElement).dataset.field || "";
            const text = ((el as HTMLElement).innerText || "").trim();
            if (!path) return;

            // Top level title & subtitle
            if (path === "itinerary.title") {
                newData.tripTitle = text;
                newData.title = text;
            } else if (path === "itinerary.subtitle") {
                newData.subtitle = text;
            }

            // Agency Overrides
            else if (path === "agency.companyName" || path === "agency.name") {
                newData.agencyOverrides.companyName = text;
            } else if (path === "agency.tagline") {
                newData.agencyOverrides.tagline = text;
            } else if (path === "agency.email") {
                newData.agencyOverrides.email = text;
            } else if (path === "agency.phone") {
                newData.agencyOverrides.phone = text;
            } else if (path === "agency.website") {
                newData.agencyOverrides.website = text;
            } else if (path === "agency.address") {
                newData.agencyOverrides.address = text;
            }

            // Consultant
            else if (path === "consultant.name") {
                newData.consultant.name = text;
            } else if (path === "consultant.title") {
                newData.consultant.title = text;
            }

            // Booking details
            else if (path === "booking.guestNames") {
                newData.guestNames = text;
                newData.bookingDetails.guestNames = text;
            } else if (path === "booking.travellerSummary") {
                newData.travellerSummary = text;
            } else if (path === "booking.reference") {
                newData.bookingRef = text;
                newData.bookingDetails.reference = text;
            } else if (path === "booking.issueDate") {
                newData.issueDate = text;
                newData.bookingDetails.issueDate = text;
            } else if (path === "booking.departureDate") {
                newData.departureDate = text;
                newData.bookingDetails.departureDate = text;
            } else if (path === "booking.returnDate") {
                newData.returnDate = text;
                newData.bookingDetails.returnDate = text;
            }

            // Destination & About
            else if (path === "destination.aboutText") {
                newData.overview = text;
                newData.summary = text;
                newData.aboutPlace.aboutText = text;
            }

            // Bank details
            else if (path === "bankDetails.accountName") {
                newData.bankDetails.accountName = text;
            } else if (path === "bankDetails.bankName") {
                newData.bankDetails.bankName = text;
            } else if (path === "bankDetails.accountNumber") {
                newData.bankDetails.accountNumber = text;
            } else if (path === "bankDetails.ifscCode") {
                newData.bankDetails.ifscCode = text;
            } else if (path === "bankDetails.upi") {
                newData.bankDetails.upi = text;
                newData.upi = text;
            } else if (path === "bankDetails.iban") {
                newData.bankDetails.iban = text;
            } else if (path === "bankDetails.swiftCode") {
                newData.bankDetails.swiftCode = text;
            } else if (path === "bankDetails.sortCode") {
                newData.bankDetails.sortCode = text;
            } else if (path === "bankDetails.branch") {
                newData.bankDetails.branch = text;
            }

            // Pricing labels & amounts
            else if (path === "pricing.packageCostLabel") {
                if (!newData.pricing) newData.pricing = {};
                newData.pricing.packageCostLabel = text;
            } else if (path === "pricing.packageCost") {
                if (!newData.pricing) newData.pricing = {};
                newData.pricing.customPackageCost = text;
                newData.pricing.packageCost = text;
            } else if (path === "pricing.taxesLabel") {
                if (!newData.pricing) newData.pricing = {};
                newData.pricing.taxesLabel = text;
            } else if (path === "pricing.taxesAmount") {
                if (!newData.pricing) newData.pricing = {};
                newData.pricing.customTaxesAmount = text;
                newData.pricing.taxesAmount = text;
            } else if (path === "pricing.totalAmount") {
                if (!newData.pricing) newData.pricing = {};
                newData.pricing.customTotalAmount = text;
                newData.pricing.totalAmount = text;
                const cleanDigits = text.replace(/[^0-9.]/g, "");
                const parsedNum = parseFloat(cleanDigits);
                if (!isNaN(parsedNum) && parsedNum > 0) {
                    newData.pricing.clientPrice = parsedNum;
                    newData.pricing.finalTotal = parsedNum;
                }
            } else if (path === "pricing.perPersonLabel") {
                if (!newData.pricing) newData.pricing = {};
                newData.pricing.perPersonLabel = text;
            }

            // Highlights array
            else if (path.startsWith("highlights[")) {
                const match = path.match(/highlights\[(\d+)\]/);
                if (match) {
                    const idx = parseInt(match[1], 10);
                    highlightsArr[idx] = text;
                }
            }

            // Inclusions, Exclusions, Terms, Conditions, Cancellation Policy
            else if (path.startsWith("inclusions[")) {
                const match = path.match(/inclusions\[(\d+)\]/);
                if (match) inclusionsArr[parseInt(match[1], 10)] = text;
            } else if (path.startsWith("exclusions[")) {
                const match = path.match(/exclusions\[(\d+)\]/);
                if (match) exclusionsArr[parseInt(match[1], 10)] = text;
            } else if (path.startsWith("terms[")) {
                const match = path.match(/terms\[(\d+)\]/);
                if (match) termsArr[parseInt(match[1], 10)] = text;
            } else if (path.startsWith("conditions[")) {
                const match = path.match(/conditions\[(\d+)\]/);
                if (match) conditionsArr[parseInt(match[1], 10)] = text;
            } else if (path.startsWith("cancellationPolicy[")) {
                const match = path.match(/cancellationPolicy\[(\d+)\]/);
                if (match) cancelArr[parseInt(match[1], 10)] = text;
            }

            // Installments
            else if (path.startsWith("pricing.installments[")) {
                const match = path.match(/pricing\.installments\[(\d+)\]\.(amount|dueDate|note)/);
                if (match) {
                    const idx = parseInt(match[1], 10);
                    const prop = match[2];
                    if (!newData.pricing) newData.pricing = {};
                    if (!Array.isArray(newData.pricing.installments)) newData.pricing.installments = [];
                    if (!newData.pricing.installments[idx]) newData.pricing.installments[idx] = {};
                    newData.pricing.installments[idx][prop] = text;
                }
            }

            // Day fields: days[0].title, days[0].location, days[0].activities[1], days[0].meals.breakfast, etc.
            else if (path.startsWith("days[")) {
                const dayMatch = path.match(/days\[(\d+)\]\.(.+)/);
                if (dayMatch && Array.isArray(newData.itinerary)) {
                    const dIdx = parseInt(dayMatch[1], 10);
                    const subProp = dayMatch[2];
                    const day = newData.itinerary[dIdx];
                    if (day) {
                        if (subProp === "title") {
                            day.title = text;
                            day.themeTitle = text;
                        } else if (subProp === "location") {
                            day.areaFocus = text;
                            day.location = text;
                        } else if (subProp === "meals.breakfast") {
                            if (!day.meals) day.meals = {};
                            day.meals.breakfast = text.replace(/^B\s*/, "");
                        } else if (subProp === "meals.lunch") {
                            if (!day.meals) day.meals = {};
                            day.meals.lunch = text.replace(/^L\s*/, "");
                        } else if (subProp === "meals.dinner") {
                            if (!day.meals) day.meals = {};
                            day.meals.dinner = text.replace(/^D\s*/, "");
                        } else if (subProp === "stay.name") {
                            if (!day.stay) day.stay = {};
                            day.stay.name = text;
                            day.accommodation = text;
                        } else if (subProp === "stay.note") {
                            if (!day.stay) day.stay = {};
                            day.stay.note = text;
                            day.accommodationNotes = text;
                        } else if (subProp.startsWith("activities[")) {
                            const actMatch = subProp.match(/activities\[(\d+)\]/);
                            if (actMatch) {
                                const aIdx = parseInt(actMatch[1], 10);
                                if (Array.isArray(day.timeline) && day.timeline[aIdx]) {
                                    if (typeof day.timeline[aIdx] === "object") {
                                        day.timeline[aIdx].activityTitle = text;
                                    } else {
                                        day.timeline[aIdx] = text;
                                    }
                                } else if (Array.isArray(day.activities)) {
                                    day.activities[aIdx] = text;
                                }
                            }
                        }
                    }
                }
            }
        });

        if (highlightsArr.length > 0) {
            const clean = highlightsArr.filter(Boolean);
            newData.highlights = clean;
            newData.aboutPlace.highlights = clean;
        }
        if (inclusionsArr.length > 0) {
            newData.inclusions = inclusionsArr.filter(Boolean);
        }
        if (exclusionsArr.length > 0) {
            newData.exclusions = exclusionsArr.filter(Boolean);
        }
        if (termsArr.length > 0) {
            newData.termsAndConditions = termsArr.filter(Boolean);
        }
        if (conditionsArr.length > 0) {
            newData.paymentMethods = conditionsArr.filter(Boolean);
        }
        if (cancelArr.length > 0) {
            newData.cancellationPolicy = cancelArr.filter(Boolean);
        }

        return newData;
    }, [liveData]);

    // ── Save back to Supabase ───────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!itinerary || !user) return;
        setSaving(true);
        try {
            // Get updated itinerary from contenteditable
            const updatedData = collectEdits();
            // Persist selected theme inside itinerary_data
            updatedData.selectedTheme = selectedTheme;

            const rawTotalText = updatedData.pricing?.customTotalAmount || updatedData.pricing?.totalAmount || "";
            const numericTotal = parseFloat(String(rawTotalText).replace(/[^0-9.]/g, ""));

            const payload: any = {
                itinerary_data: updatedData,
                title: updatedData.tripTitle || updatedData.title || itinerary.title,
                updated_at: new Date().toISOString(),
            };

            if (!isNaN(numericTotal) && numericTotal > 0) {
                payload.client_price = numericTotal;
                payload.budget = numericTotal;
            }

            const { error } = await supabase
                .from("itineraries")
                .update(payload)
                .eq("id", itinerary.id)
                .eq("user_id", user.id);

            if (error) throw error;
            setLiveData(updatedData);
            setSaved(true);
            setDirty(false);
        } catch (err: any) {
            alert("Save failed: " + (err?.message || "Unknown error"));
        } finally {
            setSaving(false);
        }
    }, [itinerary, user, collectEdits]);

    // ── Build props for PdfTemplate ─────────────────────────────
    const themeProps = useMemo(() => {
        const agent = getAgentInfo(userProfile, agencySettings);
        const pricingCfg = (liveData as any)?.pricing || itinerary?.pricing || defaultPricingConfig;
        const validHotels = filterCompleteEntriesForExport(
            (liveData as any)?.hotels || [],
            "hotel"
        );
        const validFlights = filterCompleteEntriesForExport(
            (liveData as any)?.flights || [],
            "flight"
        );
        const validCabs = filterCompleteEntriesForExport(
            (liveData as any)?.cabs || [],
            "cab"
        );
        const validBuses = filterCompleteEntriesForExport(
            (liveData as any)?.buses || [],
            "bus"
        );
        const calculatedBase = calcBaseCost({
            itinerary: liveData?.itinerary || [],
            hotels: validHotels,
            flights: validFlights,
            cabs: validCabs,
            buses: validBuses,
            pricing: pricingCfg,
        });

        const extractedFinancialTotal = extractTripCost({
            client_price: itinerary?.client_price,
            budget: itinerary?.budget,
            itinerary_data: liveData
        });

        const { finalTotal: calculatedFinalTotal } = calcPricingFromBaseCost(calculatedBase, pricingCfg);
        const resolvedFinalTotal = extractedFinancialTotal || calculatedFinalTotal;

        return {
            itinerary: liveData,
            title: itinerary?.title || liveData?.tripTitle || "Luxury Itinerary",
            clientName: itinerary?.client_name || "",
            agencySettings,
            agent,
            hotels: validHotels,
            flights: validFlights,
            cabs: validCabs,
            buses: validBuses,
            finalTotal: resolvedFinalTotal,
            pricing: pricingCfg,
            baseCost: calculatedBase,
            showTimestamps: itinerary?.show_timestamps ?? true,
            inclusions: itinerary?.inclusions || liveData?.inclusions,
            exclusions: itinerary?.exclusions || liveData?.exclusions,
            termsAndConditions: itinerary?.terms_and_conditions || liveData?.termsAndConditions,
            cancellationPolicy: itinerary?.cancellation_policy || liveData?.cancellationPolicy,
            paymentMethods: itinerary?.payment_methods || liveData?.paymentMethods,
            aboutPlace: itinerary?.about_place || liveData?.aboutPlace,
        };
    }, [liveData, itinerary, userProfile, agencySettings]);

    // ── Loading / error states ──────────────────────────────────
    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#71717A",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                }}
            >
                Loading itinerary…
            </div>
        );
    }

    if (error || !liveData) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#000000",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#e4e4e7",
                    gap: 16,
                }}
            >
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f87171" }}>
                    Error: {error || "Itinerary data missing"}
                </div>
                <button
                    onClick={() => router.back()}
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#e4e4e7",
                        borderRadius: "8px",
                        cursor: "pointer",
                        padding: "8px 20px",
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    ← Go Back
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Toolbar */}
            <EditorToolbar
                saving={saving}
                saved={saved}
                dirty={dirty}
                onSave={handleSave}
                onToggleEdit={() => setEditMode((m) => !m)}
                editMode={editMode}
                itineraryTitle={itinerary?.title || ""}
                onBack={() => router.back()}
                selectedTheme={selectedTheme}
                onThemeChange={(theme) => { setSelectedTheme(theme); setDirty(true); setSaved(false); }}
            />

            {/* Edit mode hint banner */}
            {editMode && (
                <div
                    style={{
                        position: "fixed",
                        top: 56,
                        left: 0,
                        right: 0,
                        zIndex: 9998,
                        background: "#18181b",
                        borderBottom: "1px solid #27272a",
                        padding: "8px 24px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#71717A",
                        textAlign: "center",
                    }}
                >
                    Click any highlighted field to edit · Changes auto-apply to the PDF theme on export
                </div>
            )}

            {/* Itinerary render — PdfTemplate renders the selected theme.
                instrumentTheme() stamps data-field on all themes after mount. */}
            <div
                style={{ paddingTop: editMode ? 88 : 56, background: "#000000", minHeight: "100vh" }}
            >
                <div ref={containerRef}>
                    <PdfTemplate {...(themeProps as any)} theme={selectedTheme} />
                </div>
            </div>
        </>
    );
}
