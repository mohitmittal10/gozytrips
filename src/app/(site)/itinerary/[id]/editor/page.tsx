"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { LuxuryTheme } from "@/components/pdf/themes/luxury-theme";
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
}: {
    saving: boolean;
    saved: boolean;
    dirty: boolean;
    onSave: () => void;
    onToggleEdit: () => void;
    editMode: boolean;
    itineraryTitle: string;
    onBack: () => void;
}) {
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                background: "rgba(10,10,9,0.97)",
                borderBottom: "1px solid rgba(201,168,76,0.25)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                height: 56,
                fontFamily: "'DM Mono', monospace",
                gap: 16,
            }}
        >
            {/* Left: back + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                <button
                    onClick={onBack}
                    style={{
                        background: "none",
                        border: "1px solid rgba(201,168,76,0.22)",
                        color: "#c9a84c",
                        cursor: "pointer",
                        padding: "4px 12px",
                        fontSize: 12,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                    }}
                >
                    ← Back
                </button>
                <span
                    style={{
                        color: "rgba(245,240,232,0.45)",
                        fontSize: 11,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {itineraryTitle || "Luxury Itinerary"}
                </span>
            </div>

            {/* Center: mode indicator */}
            <div
                style={{
                    fontSize: 11,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: editMode ? "#c9a84c" : "rgba(245,240,232,0.3)",
                    transition: "color 0.2s",
                }}
            >
                {editMode ? "✏ Edit Mode" : "Preview Mode"}
            </div>

            {/* Right: controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                    onClick={onToggleEdit}
                    style={{
                        background: editMode ? "rgba(201,168,76,0.12)" : "transparent",
                        border: `1px solid ${editMode ? "#c9a84c" : "rgba(245,240,232,0.2)"}`,
                        color: editMode ? "#c9a84c" : "rgba(245,240,232,0.55)",
                        cursor: "pointer",
                        padding: "5px 14px",
                        fontSize: 11,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
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
                            background: saving ? "rgba(201,168,76,0.3)" : "#c9a84c",
                            border: "none",
                            color: "#0a0a09",
                            cursor: saving ? "not-allowed" : "pointer",
                            padding: "5px 18px",
                            fontSize: 11,
                            letterSpacing: "1.5px",
                            textTransform: "uppercase",
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
                            fontSize: 11,
                            color: "#4ade80",
                            letterSpacing: "1.2px",
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

    // We hold mutated itinerary_data separately so we can track changes
    const [liveData, setLiveData] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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
                fetchedRef.current = true;
            }
            setLoading(false);
        };
        fetchItinerary();
        return () => { isSubscribed = false; };
    }, [id, user?.id]);

    // ── Toggle edit: make fields contenteditable ────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        const fields = containerRef.current.querySelectorAll("[data-field]");
        fields.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (editMode) {
                if (htmlEl.contentEditable !== "true") {
                    htmlEl.contentEditable = "true";
                    htmlEl.style.outline = "1px dashed rgba(201,168,76,0.45)";
                    htmlEl.style.outlineOffset = "2px";
                    htmlEl.style.cursor = "text";
                    htmlEl.style.borderRadius = "2px";
                }
            } else {
                if (htmlEl.contentEditable !== "false") {
                    htmlEl.contentEditable = "false";
                    htmlEl.style.outline = "";
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

    // ── Build props for LuxuryTheme ─────────────────────────────
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
                    background: "#0a0a09",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Mono', monospace",
                    color: "rgba(245,240,232,0.4)",
                    fontSize: 13,
                    letterSpacing: "2px",
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
                    background: "#0a0a09",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Mono', monospace",
                    color: "rgba(245,240,232,0.55)",
                    gap: 16,
                }}
            >
                <div style={{ fontSize: 13, letterSpacing: "2px", color: "#f87171" }}>
                    Error: {error || "Itinerary data missing"}
                </div>
                <button
                    onClick={() => router.back()}
                    style={{
                        background: "none",
                        border: "1px solid rgba(201,168,76,0.3)",
                        color: "#c9a84c",
                        cursor: "pointer",
                        padding: "8px 20px",
                        fontSize: 12,
                        letterSpacing: "1.5px",
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
                        background: "rgba(201,168,76,0.08)",
                        borderBottom: "1px solid rgba(201,168,76,0.18)",
                        padding: "8px 24px",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        letterSpacing: "1.4px",
                        color: "rgba(201,168,76,0.75)",
                        textAlign: "center",
                    }}
                >
                    Click any highlighted field to edit · Changes are saved to the database
                </div>
            )}

            {/* Itinerary render */}
            <div
                style={{ paddingTop: editMode ? 80 : 56, background: "#0a0a09", minHeight: "100vh" }}
            >
                <div ref={containerRef}>
                    <LuxuryTheme {...(themeProps as any)} />
                </div>
            </div>
        </>
    );
}
