"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { PdfTemplate } from "@/components/pdf-template";
import type { PdfTheme } from "@/components/pdf/theme-config";
import { DEFAULT_PDF_THEME_OPTIONS } from "@/components/pdf/theme-config";
import { getAgentInfo, formatTitleCase } from "@/components/pdf/utils";
import { calcPricingFromBaseCost, calcBaseCost, extractTripCost } from "@/services/financial";
import { defaultPricingConfig } from "@/types/pricing";
import { filterCompleteEntriesForExport } from "@/lib/validation/logistics-validation";
import { ImagePicker } from "./ImagePicker";
import { FloatingToolbar } from "./FloatingToolbar";
import { StructuralControls } from "./StructuralControls";

// ─────────────────────────────────────────────────────────────
// Toolbar: save / editing state
// ─────────────────────────────────────────────────────────────
function EditorToolbar({
    saving,
    saved,
    dirty,
    onSave,
    onToggleEdit,
    onAddDay,
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
    onAddDay: () => void;
    editMode: boolean;
    itineraryTitle: string;
    onBack: () => void;
    selectedTheme: PdfTheme;
    onThemeChange: (theme: PdfTheme) => void;
}) {
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-zinc-950/95 border-b border-zinc-800/80 backdrop-blur-xl flex flex-wrap lg:flex-nowrap items-center justify-between px-3 sm:px-6 py-2 lg:py-0 min-h-[56px] lg:h-14 font-sans gap-2 sm:gap-4 overflow-x-auto hide-scrollbar">
            {/* Left: back + title */}
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 shrink-0">
                <button
                    onClick={onBack}
                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer"
                >
                    ← Back
                </button>
                <span className="text-xs font-medium text-zinc-400 border-l border-zinc-800 pl-2.5 sm:pl-3 truncate max-w-[110px] sm:max-w-[200px] md:max-w-xs">
                    {itineraryTitle || "Itinerary Editor"}
                </span>
            </div>

            {/* Center: mode indicator badge */}
            <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5 sm:p-1 shadow-inner shrink-0 scale-95 sm:scale-100">
                <button
                    onClick={() => editMode && onToggleEdit()}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        !editMode
                            ? "bg-zinc-800 text-zinc-100 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                    Preview
                </button>
                <button
                    onClick={() => !editMode && onToggleEdit()}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        editMode
                            ? "bg-zinc-800 text-zinc-100 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                    ✏ Edit
                </button>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                {/* Theme selector */}
                <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 whitespace-nowrap">
                    <span className="hidden sm:inline">Theme</span>
                    <select
                        disabled={saving}
                        value={selectedTheme}
                        onChange={(e) => onThemeChange(e.target.value as PdfTheme)}
                        title="Select PDF theme"
                        className={`bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold outline-none focus:border-zinc-600 transition-colors ${
                            saving
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:border-zinc-700"
                        }`}
                    >
                        {DEFAULT_PDF_THEME_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-zinc-950 text-zinc-200">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {editMode && (
                    <button
                        onClick={onAddDay}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                        + Day
                    </button>
                )}

                <button
                    onClick={onToggleEdit}
                    className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        editMode
                            ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100"
                            : "bg-primary text-primary-foreground border-transparent hover:opacity-90 shadow-md"
                    }`}
                >
                    {editMode ? "Done" : "Edit Content"}
                </button>

                {saving ? (
                    <span className="text-[11px] sm:text-xs font-semibold text-sky-400 flex items-center gap-1 animate-pulse whitespace-nowrap">
                        Saving…
                    </span>
                ) : dirty ? (
                    <div className="flex items-center gap-1.5 sm:gap-2.5">
                        <span className="hidden sm:inline-block text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                            Unsaved
                        </span>
                        <button
                            onClick={onSave}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <span className="text-[11px] sm:text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap">
                        ✓ Saved
                    </span>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Helper functions to sanitize collected text and prevent duplicate timestamps/bullets
function cleanActivityText(str: string): string {
    if (!str) return "";
    let cleaned = str;
    let prev = "";
    while (cleaned !== prev) {
        prev = cleaned;
        cleaned = cleaned.replace(/^\s*(?:\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*[-–—•]?\s*)+/gi, "").trim();
        cleaned = cleaned.replace(/^\s*(?:[-•◆✓✕✦\*\+]\s*|\d+[\.\)]\s*)+/gi, "").trim();
    }
    return cleaned;
}

function cleanListItemText(str: string): string {
    if (!str) return "";
    return str.replace(/^\s*(?:[-•◆✓✕✦\*\+]\s*|\d+[\.\)]\s*)+/gi, "").trim();
}

function sanitizeItineraryData(data: any) {
    if (!data || typeof data !== "object") return data;
    const cloned = JSON.parse(JSON.stringify(data));
    if (Array.isArray(cloned.itinerary)) {
        cloned.itinerary.forEach((day: any) => {
            if (Array.isArray(day.timeline)) {
                day.timeline.forEach((step: any) => {
                    if (step && typeof step === "object") {
                        if (typeof step.details === "string") {
                            step.details = cleanActivityText(step.details);
                        }
                        if (typeof step.activityTitle === "string") {
                            step.activityTitle = cleanActivityText(step.activityTitle);
                        }
                    }
                });
            }
            if (Array.isArray(day.activities)) {
                day.activities = day.activities.map((act: any) =>
                    typeof act === "string" ? cleanActivityText(act) : act
                );
            }
        });
    }
    if (Array.isArray(cloned.inclusions)) {
        cloned.inclusions = cloned.inclusions.map((item: any) => typeof item === "string" ? cleanListItemText(item) : item);
    }
    if (Array.isArray(cloned.exclusions)) {
        cloned.exclusions = cloned.exclusions.map((item: any) => typeof item === "string" ? cleanListItemText(item) : item);
    }
    if (Array.isArray(cloned.terms)) {
        cloned.terms = cloned.terms.map((item: any) => typeof item === "string" ? cleanListItemText(item) : item);
    }
    if (Array.isArray(cloned.conditions)) {
        cloned.conditions = cloned.conditions.map((item: any) => typeof item === "string" ? cleanListItemText(item) : item);
    }
    if (Array.isArray(cloned.cancellationPolicy)) {
        cloned.cancellationPolicy = cloned.cancellationPolicy.map((item: any) => typeof item === "string" ? cleanListItemText(item) : item);
    }
    if (Array.isArray(cloned.daySummaries)) {
        cloned.daySummaries = cloned.daySummaries.map((item: any) => typeof item === "string" ? cleanActivityText(item) : item);
    }
    return cloned;
}

// instrumentTheme: stamps data-field on any rendered theme's DOM
// so the contenteditable editing system works universally.
// ─────────────────────────────────────────────────────────────
function instrumentTheme(container: HTMLDivElement, liveData: any) {
    // Helper: stamp a data-field on an element only if not already set
    const stamp = (el: Element | null, field: string) => {
        if (el && !el.getAttribute("data-field")) {
            el.setAttribute("data-field", field);
        }
    };
    const stampImage = (el: Element | null, field: string) => {
        if (el && !el.getAttribute("data-image-field")) {
            el.setAttribute("data-image-field", field);
        }
    };

    // — Cover: trip title & cover hero image
    const cover = container.querySelector("[data-pdf-section='cover']");
    if (cover) {
        const titleEl = cover.querySelector("h1") || cover.querySelector("h2");
        stamp(titleEl, "itinerary.title");
        const coverImg = cover.querySelector("img") || cover.querySelector("[style*='background-image']");
        stampImage(coverImg, "cover.imageUrl");
    }

    // — Days: location header, hero image + activity lines
    const days = liveData?.itinerary || [];
    days.forEach((_day: any, idx: number) => {
        const daySection = container.querySelector(`[data-pdf-section='day-${idx}']`);
        if (!daySection) return;

        const dayTitle = daySection.querySelector("h3") ||
            daySection.querySelector("h4") ||
            daySection.querySelector("h2");
        stamp(dayTitle, `days[${idx}].location`);

        const dayImg = daySection.querySelector("img") || daySection.querySelector("[style*='background-image']");
        stampImage(dayImg, `days[${idx}].imageUrl`);

        const activityEls = Array.from(
            daySection.querySelectorAll("p, li")
        ).filter(el => {
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
        const allItems = Array.from(inclusionsSection.querySelectorAll("li, span, p")).filter(el => {
            const text = (el as HTMLElement).innerText?.trim() || "";
            return text.length > 2 && !(el as HTMLElement).querySelector("li, span, p");
        });

        const getListLength = (val: any) => {
            if (!val) return 0;
            if (Array.isArray(val)) return val.filter(Boolean).length;
            if (typeof val === "string") return val.split("\n").map((s: string) => s.trim()).filter(Boolean).length;
            return 0;
        };

        const incCount = getListLength(liveData?.inclusions) || Math.ceil(allItems.length / 2);

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

    // — About Destination section
    const aboutSection = container.querySelector("[data-pdf-section='about']");
    if (aboutSection) {
        const titleEl = aboutSection.querySelector("h2") || aboutSection.querySelector("h3");
        stamp(titleEl, "aboutPlace.title");
        const descEl = aboutSection.querySelector("p");
        stamp(descEl, "aboutPlace.description");

        const hlSpans = Array.from(aboutSection.querySelectorAll("span")).filter(el => {
            const text = (el as HTMLElement).innerText?.trim() || "";
            return text.length > 1 && text !== "✓";
        });
        hlSpans.forEach((el, i) => {
            stamp(el, `aboutPlace.highlights[${i}]`);
        });
    }

    // — Daywise Index / Itinerary at a Glance section
    const glanceSection = container.querySelector("[data-pdf-section='daywise-index'], [data-pdf-section='brief-plan']");
    if (glanceSection) {
        const rows = Array.from(glanceSection.querySelectorAll("p"));
        rows.forEach((pEl, i) => {
            stamp(pEl, `daySummaries[${i}]`);
        });
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

    const [localAgencySettings, setLocalAgencySettings] = useState<any>(null);
    const [localUserProfile, setLocalUserProfile] = useState<any>(null);
    const [localClient, setLocalClient] = useState<any>(null);

    // We hold mutated itinerary_data separately so we can track changes
    const [liveData, setLiveData] = useState<any>(null);
    const liveDataRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const editModeRef = useRef(false);
    const dirtyRef = useRef(false);

    // Keep refs in sync with state
    useEffect(() => { liveDataRef.current = liveData; }, [liveData]);
    useEffect(() => { editModeRef.current = editMode; }, [editMode]);
    useEffect(() => { dirtyRef.current = dirty; }, [dirty]);

    // ── Fetch itinerary & user/agency profile from Supabase ────
    const fetchItineraryFromDb = useCallback(async (forceUpdateLiveData = false) => {
        if (!id || !user?.id) return;

        const [{ data, error }, { data: profileData }, { data: agencyData }] = await Promise.all([
            supabase
                .from("itineraries")
                .select("*, clients(*)")
                .eq("id", id)
                .eq("user_id", user.id)
                .single(),
            supabase
                .from("user_profiles")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle(),
            supabase
                .from("agency_settings")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle(),
        ]);

        if (profileData) setLocalUserProfile(profileData);
        if (agencyData) setLocalAgencySettings(agencyData);

        if (error || !data) {
            if (!liveDataRef.current) setError(error?.message || "Itinerary not found");
        } else {
            setItinerary(data);
            // Only overwrite liveData when: (a) first load, (b) forced (external DB change), OR (c) no unsaved edits
            const shouldUpdate = forceUpdateLiveData || !liveDataRef.current || !dirtyRef.current;
            if (shouldUpdate && !editModeRef.current) {
                setLiveData(sanitizeItineraryData(data.itinerary_data));
            } else if (!liveDataRef.current) {
                // First load always sets liveData
                setLiveData(sanitizeItineraryData(data.itinerary_data));
            }
            // Restore saved theme from itinerary_data or fall back to user default
            const savedTheme = data.itinerary_data?.selectedTheme as PdfTheme | undefined;
            if (savedTheme && !dirtyRef.current) setSelectedTheme(savedTheme);

            // Fetch linked client record if client_id exists or join returns client
            let clientRecord = (data as any)?.clients || null;
            if (!clientRecord && data.client_id) {
                const { data: clientData } = await supabase
                    .from("clients")
                    .select("*")
                    .eq("id", data.client_id)
                    .maybeSingle();
                clientRecord = clientData;
            }
            if (clientRecord) {
                setLocalClient(clientRecord);
            }
        }
        setLoading(false);
    }, [id, user?.id, supabase]);

    useEffect(() => {
        if (!id || !user?.id) return;
        setLoading(true);
        fetchItineraryFromDb(false);
    }, [id, user?.id]);

    // ── Re-fetch on window focus (to catch Lab changes saved while editor is open) ──
    useEffect(() => {
        const handleFocus = () => {
            // Only re-fetch if not currently editing with unsaved changes
            if (!editModeRef.current || !dirtyRef.current) {
                fetchItineraryFromDb(true);
            }
        };
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [fetchItineraryFromDb]);

    // ── Supabase Realtime subscription: catch DB changes from other tabs/sessions ──
    useEffect(() => {
        if (!id || !user?.id) return;
        const channel = supabase
            .channel(`itinerary-editor-${id}`)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "itineraries", filter: `id=eq.${id}` },
                () => {
                    // Only auto-apply if user isn't actively editing
                    if (!editModeRef.current || !dirtyRef.current) {
                        fetchItineraryFromDb(true);
                    }
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [id, user?.id, supabase, fetchItineraryFromDb]);

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
        // Re-instrument synchronously when entering edit mode (handles theme switches & new days)
        if (editMode && liveDataRef.current) instrumentTheme(containerRef.current, liveDataRef.current);
        const fields = containerRef.current.querySelectorAll("[data-field]");
        fields.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (editMode) {
                if (htmlEl.contentEditable !== "true") {
                    htmlEl.contentEditable = "true";
                    htmlEl.classList.add("html-editor-field-active");
                }
            } else {
                if (htmlEl.contentEditable !== "false") {
                    htmlEl.contentEditable = "false";
                    htmlEl.classList.remove("html-editor-field-active");
                }
            }
        });
    }, [editMode, liveData?.itinerary?.length, selectedTheme]);

    // ── Image Picker State & Handlers ──────────────────────────────
    const [imagePickerOpen, setImagePickerOpen] = useState(false);
    const [imagePickerQuery, setImagePickerQuery] = useState("destination photo");
    const [imageTargetField, setImageTargetField] = useState<string>("cover.imageUrl");

    const handleOpenImagePicker = useCallback((query?: string, field?: string) => {
        setImagePickerQuery(query || "destination photo");
        setImageTargetField(field || "cover.imageUrl");
        setImagePickerOpen(true);
    }, []);

    const handleSelectImage = useCallback((url: string) => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            if (imageTargetField === "cover.imageUrl" || imageTargetField.startsWith("cover")) {
                updated.coverImageUrl = url;
            } else if (imageTargetField.startsWith("days[")) {
                const match = imageTargetField.match(/days\[(\d+)\]/);
                if (match && Array.isArray(updated.itinerary)) {
                    const dIdx = parseInt(match[1], 10);
                    if (updated.itinerary[dIdx]) {
                        updated.itinerary[dIdx].imageUrl = url;
                    }
                }
            }
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, [imageTargetField]);

    // ── Add Day action ────────────────────────────────────────────────
    const handleAddDay = useCallback(() => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const currentDays = Array.isArray(prev.itinerary) ? prev.itinerary : [];
            const newDayNum = currentDays.length + 1;
            const newDay = {
                day: newDayNum,
                title: `Day ${newDayNum}`,
                themeTitle: `Day ${newDayNum}`,
                areaFocus: `Destination Day ${newDayNum}`,
                location: `Destination Day ${newDayNum}`,
                timeline: [
                    {
                        time: "09:00 AM",
                        activityTitle: `Day ${newDayNum} Morning Activity`,
                        details: `Explore top sights, culture, and highlights for Day ${newDayNum}.`
                    }
                ],
                activities: [`Explore top sights, culture, and highlights for Day ${newDayNum}.`]
            };
            return {
                ...prev,
                itinerary: [...currentDays, newDay]
            };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    // ── Day Structural Handlers ─────────────────────────────────────
    const handleDeleteDay = useCallback((dayIdx: number) => {
        setLiveData((prev: any) => {
            if (!prev || !Array.isArray(prev.itinerary)) return prev;
            const newDays = prev.itinerary.filter((_: any, i: number) => i !== dayIdx);
            newDays.forEach((d: any, i: number) => { d.day = i + 1; });
            return { ...prev, itinerary: newDays };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleReorderDays = useCallback((fromIdx: number, toIdx: number) => {
        setLiveData((prev: any) => {
            if (!prev || !Array.isArray(prev.itinerary)) return prev;
            if (toIdx < 0 || toIdx >= prev.itinerary.length) return prev;
            const newDays = [...prev.itinerary];
            const [moved] = newDays.splice(fromIdx, 1);
            newDays.splice(toIdx, 0, moved);
            newDays.forEach((d: any, i: number) => { d.day = i + 1; });
            return { ...prev, itinerary: newDays };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    // ── Activity Structural Handlers ────────────────────────────────
    const handleAddActivity = useCallback((dayIdx: number) => {
        setLiveData((prev: any) => {
            if (!prev || !Array.isArray(prev.itinerary)) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            const day = updated.itinerary[dayIdx];
            if (day) {
                if (!Array.isArray(day.timeline)) day.timeline = [];
                const newAct = {
                    time: "12:00 PM",
                    activityTitle: `New Activity ${day.timeline.length + 1}`,
                    details: `Description for new activity ${day.timeline.length + 1}`,
                };
                day.timeline.push(newAct);
                if (Array.isArray(day.activities)) {
                    day.activities.push(newAct.details);
                }
            }
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleDeleteActivity = useCallback((dayIdx: number, actIdx: number) => {
        setLiveData((prev: any) => {
            if (!prev || !Array.isArray(prev.itinerary)) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            const day = updated.itinerary[dayIdx];
            if (day) {
                if (Array.isArray(day.timeline)) {
                    day.timeline = day.timeline.filter((_: any, i: number) => i !== actIdx);
                }
                if (Array.isArray(day.activities)) {
                    day.activities = day.activities.filter((_: any, i: number) => i !== actIdx);
                }
            }
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleMoveActivity = useCallback((dayIdx: number, actIdx: number, dir: "up" | "down") => {
        setLiveData((prev: any) => {
            if (!prev || !Array.isArray(prev.itinerary)) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            const day = updated.itinerary[dayIdx];
            if (!day || !Array.isArray(day.timeline)) return prev;
            const targetIdx = dir === "up" ? actIdx - 1 : actIdx + 1;
            if (targetIdx < 0 || targetIdx >= day.timeline.length) return prev;
            const [moved] = day.timeline.splice(actIdx, 1);
            day.timeline.splice(targetIdx, 0, moved);
            if (Array.isArray(day.activities)) {
                const [movedAct] = day.activities.splice(actIdx, 1);
                day.activities.splice(targetIdx, 0, movedAct);
            }
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleUpdateTime = useCallback((dayIdx: number, actIdx: number, newTime: string) => {
        setLiveData((prev: any) => {
            if (!prev || !Array.isArray(prev.itinerary)) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            const day = updated.itinerary[dayIdx];
            if (day && Array.isArray(day.timeline) && day.timeline[actIdx]) {
                if (typeof day.timeline[actIdx] === "object") {
                    day.timeline[actIdx].time = newTime;
                }
            }
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, []);

    // ── Inclusions & Policies Handlers ─────────────────────────────
    const handleAddInclusion = useCallback(() => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const current = Array.isArray(prev.inclusions)
                ? [...prev.inclusions]
                : typeof prev.inclusions === "string"
                    ? prev.inclusions.split("\n").filter(Boolean)
                    : [];
            return { ...prev, inclusions: [...current, "New Inclusion Item"] };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleDeleteInclusion = useCallback((idx: number) => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const current = Array.isArray(prev.inclusions)
                ? [...prev.inclusions]
                : typeof prev.inclusions === "string"
                    ? prev.inclusions.split("\n").filter(Boolean)
                    : [];
            return { ...prev, inclusions: current.filter((_: any, i: number) => i !== idx) };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleAddExclusion = useCallback(() => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const current = Array.isArray(prev.exclusions)
                ? [...prev.exclusions]
                : typeof prev.exclusions === "string"
                    ? prev.exclusions.split("\n").filter(Boolean)
                    : [];
            return { ...prev, exclusions: [...current, "New Exclusion Item"] };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleDeleteExclusion = useCallback((idx: number) => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const current = Array.isArray(prev.exclusions)
                ? [...prev.exclusions]
                : typeof prev.exclusions === "string"
                    ? prev.exclusions.split("\n").filter(Boolean)
                    : [];
            return { ...prev, exclusions: current.filter((_: any, i: number) => i !== idx) };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleAddTerm = useCallback(() => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const current = Array.isArray(prev.termsAndConditions) ? [...prev.termsAndConditions] : [];
            return { ...prev, termsAndConditions: [...current, "Standard terms and conditions apply."] };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleDeleteTerm = useCallback((idx: number) => {
        setLiveData((prev: any) => {
            if (!prev || !Array.isArray(prev.termsAndConditions)) return prev;
            return { ...prev, termsAndConditions: prev.termsAndConditions.filter((_: any, i: number) => i !== idx) };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleAddCancellation = useCallback(() => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const current = Array.isArray(prev.cancellationPolicy) ? [...prev.cancellationPolicy] : [];
            return { ...prev, cancellationPolicy: [...current, "Cancellation within 30 days incurs 50% charge."] };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleDeleteCancellation = useCallback((idx: number) => {
        setLiveData((prev: any) => {
            if (!prev || !Array.isArray(prev.cancellationPolicy)) return prev;
            return { ...prev, cancellationPolicy: prev.cancellationPolicy.filter((_: any, i: number) => i !== idx) };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleAddPayment = useCallback(() => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const current = Array.isArray(prev.paymentMethods) ? [...prev.paymentMethods] : [];
            return { ...prev, paymentMethods: [...current, "Bank Transfer / UPI / Credit Card accepted."] };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleDeletePayment = useCallback((idx: number) => {
        setLiveData((prev: any) => {
            if (!prev || !Array.isArray(prev.paymentMethods)) return prev;
            return { ...prev, paymentMethods: prev.paymentMethods.filter((_: any, i: number) => i !== idx) };
        });
        setDirty(true);
        setSaved(false);
    }, []);

    // ── Day Summaries (Itinerary at a Glance) Handler ──────────────
    const handleUpdateDaySummary = useCallback((dayIdx: number, text: string) => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            if (!Array.isArray(updated.daySummaries)) {
                updated.daySummaries = [];
            }
            updated.daySummaries[dayIdx] = cleanActivityText(text);
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, []);

    // ── About Place (Destination Description) Handlers ────────────
    const handleUpdateAboutTitle = useCallback((title: string) => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            if (!updated.aboutPlace) updated.aboutPlace = {};
            updated.aboutPlace.title = title;
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleUpdateAboutDescription = useCallback((desc: string) => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            if (!updated.aboutPlace) updated.aboutPlace = {};
            updated.aboutPlace.description = desc;
            updated.aboutPlace.aboutText = desc;
            updated.overview = desc;
            updated.summary = desc;
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleAddHighlight = useCallback(() => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            if (!updated.aboutPlace) updated.aboutPlace = {};
            const current = Array.isArray(updated.aboutPlace.highlights)
                ? [...updated.aboutPlace.highlights]
                : Array.isArray(updated.highlights)
                    ? [...updated.highlights]
                    : [];
            const newHl = "New Destination Highlight";
            updated.aboutPlace.highlights = [...current, newHl];
            updated.highlights = [...current, newHl];
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleDeleteHighlight = useCallback((idx: number) => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            if (!updated.aboutPlace) updated.aboutPlace = {};
            const current = Array.isArray(updated.aboutPlace.highlights)
                ? [...updated.aboutPlace.highlights]
                : Array.isArray(updated.highlights)
                    ? [...updated.highlights]
                    : [];
            const next = current.filter((_: any, i: number) => i !== idx);
            updated.aboutPlace.highlights = next;
            updated.highlights = next;
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, []);

    const handleUpdateHighlight = useCallback((idx: number, text: string) => {
        setLiveData((prev: any) => {
            if (!prev) return prev;
            const updated = JSON.parse(JSON.stringify(prev));
            if (!updated.aboutPlace) updated.aboutPlace = {};
            if (!Array.isArray(updated.aboutPlace.highlights)) {
                updated.aboutPlace.highlights = [];
            }
            updated.aboutPlace.highlights[idx] = text;
            updated.highlights = [...updated.aboutPlace.highlights];
            return updated;
        });
        setDirty(true);
        setSaved(false);
    }, []);

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
            const htmlContent = ((el as HTMLElement).innerHTML || "").trim();
            const textContent = ((el as HTMLElement).innerText || "").trim();
            // Preserve rich HTML formatting like <b>, <i>, <strong> if present
            const text = /<[a-z][\s\S]*>/i.test(htmlContent)
                ? htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                : textContent;
            if (!path) return;

            // Top level title & subtitle
            if (path === "itinerary.title") {
                const formattedTitle = formatTitleCase(text);
                newData.tripTitle = formattedTitle;
                newData.title = formattedTitle;
            } else if (path === "itinerary.subtitle") {
                newData.subtitle = text;
            }

            // Agency Overrides vs Consultant Name
            else if (path === "agency.companyName") {
                newData.agencyOverrides.companyName = text;
            } else if (path === "agency.agentName" || path === "agency.name" || path === "consultant.name") {
                newData.consultant.name = text;
                newData.agencyOverrides.agentName = text;
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
            else if (path === "consultant.title") {
                newData.consultant.title = text;
            }

            // Booking details & Client Name
            else if (path === "booking.guestNames" || path === "client.name" || path === "booking.clientName") {
                newData.guestNames = text;
                newData.clientName = text;
                if (!newData.bookingDetails) newData.bookingDetails = {};
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
            else if (path === "aboutPlace.title" || path === "destination.title") {
                if (!newData.aboutPlace) newData.aboutPlace = {};
                newData.aboutPlace.title = text;
            } else if (path === "aboutPlace.description" || path === "destination.aboutText" || path === "destination.description") {
                if (!newData.aboutPlace) newData.aboutPlace = {};
                newData.aboutPlace.description = text;
                newData.aboutPlace.aboutText = text;
                newData.overview = text;
                newData.summary = text;
            } else if (path.startsWith("aboutPlace.highlights[")) {
                const match = path.match(/aboutPlace\.highlights\[(\d+)\]/);
                if (match) {
                    const idx = parseInt(match[1], 10);
                    highlightsArr[idx] = text;
                }
            } else if (path.startsWith("daySummaries[")) {
                const match = path.match(/daySummaries\[(\d+)\]/);
                if (match) {
                    const idx = parseInt(match[1], 10);
                    if (!Array.isArray(newData.daySummaries)) newData.daySummaries = [];
                    newData.daySummaries[idx] = cleanActivityText(text);
                }
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
                if (match) inclusionsArr[parseInt(match[1], 10)] = cleanListItemText(text);
            } else if (path.startsWith("exclusions[")) {
                const match = path.match(/exclusions\[(\d+)\]/);
                if (match) exclusionsArr[parseInt(match[1], 10)] = cleanListItemText(text);
            } else if (path.startsWith("terms[")) {
                const match = path.match(/terms\[(\d+)\]/);
                if (match) termsArr[parseInt(match[1], 10)] = cleanListItemText(text);
            } else if (path.startsWith("conditions[")) {
                const match = path.match(/conditions\[(\d+)\]/);
                if (match) conditionsArr[parseInt(match[1], 10)] = cleanListItemText(text);
            } else if (path.startsWith("cancellationPolicy[")) {
                const match = path.match(/cancellationPolicy\[(\d+)\]/);
                if (match) cancelArr[parseInt(match[1], 10)] = cleanListItemText(text);
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
                                const cleanAct = cleanActivityText(text);
                                if (Array.isArray(day.timeline) && day.timeline[aIdx]) {
                                    if (typeof day.timeline[aIdx] === "object") {
                                        // Write to both fields: activityTitle (PDF theme) AND details (The Lab timeline)
                                        day.timeline[aIdx].activityTitle = cleanAct;
                                        day.timeline[aIdx].details = cleanAct;
                                    } else {
                                        day.timeline[aIdx] = cleanAct;
                                    }
                                } else if (Array.isArray(day.activities)) {
                                    day.activities[aIdx] = cleanAct;
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

    // ── Track changes & sync liveData from contenteditable ────────
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleInput = () => {
            if (!editMode) return;
            // Only mark dirty during typing — do NOT call setLiveData here.
            // Calling setLiveData triggers a React re-render of PdfTemplate which
            // destroys and recreates the contenteditable DOM, resetting the cursor
            // to position 0. The DOM is the live source of truth while editing;
            // collectEdits() reads from it at blur-time and at explicit save.
            setDirty(true);
            setSaved(false);
        };

        const handleBlur = () => {
            if (!editMode) return;
            // Safe to sync liveData on blur: the user has already moved away,
            // so there is no active cursor to displace.
            if (containerRef.current) {
                const updated = collectEdits();
                if (updated) {
                    setLiveData(updated);
                    setDirty(true);
                    setSaved(false);
                }
            }
        };

        container.addEventListener("input", handleInput);
        container.addEventListener("focusout", handleBlur);

        return () => {
            container.removeEventListener("input", handleInput);
            container.removeEventListener("focusout", handleBlur);
        };
    }, [editMode, collectEdits]);


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

            const formattedTitle = formatTitleCase(updatedData.tripTitle || updatedData.title || itinerary.title);
            updatedData.tripTitle = formattedTitle;
            updatedData.title = formattedTitle;

            const payload: any = {
                itinerary_data: updatedData,
                title: formattedTitle,
                updated_at: new Date().toISOString(),
                last_activity_at: new Date().toISOString(),
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
            console.error("Save failed:", err);
            alert("Save failed: " + (err?.message || "Unknown error"));
        } finally {
            setSaving(false);
        }
    }, [itinerary, user, collectEdits, liveData, selectedTheme, supabase]);

    const handleToggleEdit = useCallback(() => {
        if (editMode && containerRef.current) {
            const updated = collectEdits();
            if (updated) setLiveData(updated);
        }
        setEditMode((m) => !m);
    }, [editMode, collectEdits]);

    const handleThemeChange = useCallback((theme: PdfTheme) => {
        if (saving) return;
        setSelectedTheme(theme);

        // Asynchronously persist selected theme preference to DB without DOM scraping or setting content dirty
        if (itinerary && user) {
            const currentData = liveDataRef.current || liveData;
            const updatedData = { ...currentData, selectedTheme: theme };
            supabase
                .from("itineraries")
                .update({
                    itinerary_data: updatedData,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", itinerary.id)
                .eq("user_id", user.id)
                .then(({ error }) => {
                    if (error) console.error("Failed to persist theme preference:", error);
                });
        }
    }, [saving, itinerary, user, liveData, supabase]);

    // ── Build props for PdfTemplate ─────────────────────────────
    const themeProps = useMemo(() => {
        const effectiveUserProfile = userProfile || localUserProfile;
        const effectiveAgencySettings = agencySettings || localAgencySettings;
        const agent = getAgentInfo(effectiveUserProfile, effectiveAgencySettings, liveData);

        const hasAssignedClient = Boolean(
            localClient ||
            itinerary?.client_id ||
            liveData?.guestNames ||
            liveData?.clientName ||
            liveData?.client_name ||
            liveData?.guest_names ||
            liveData?.bookingDetails?.guestNames ||
            liveData?.bookingDetails?.clientName ||
            liveData?.bookingDetails?.customerName ||
            liveData?.clientDetails?.name ||
            liveData?.clientDetails?.clientName ||
            liveData?.guestName ||
            (itinerary as any)?.clients?.name ||
            (itinerary as any)?.clients?.client_name ||
            (itinerary as any)?.client?.name ||
            itinerary?.client_name ||
            itinerary?.client_names ||
            itinerary?.guest_names
        );

        const resolvedClientName = hasAssignedClient
            ? (
                liveData?.guestNames ||
                liveData?.clientName ||
                liveData?.client_name ||
                liveData?.guest_names ||
                liveData?.bookingDetails?.guestNames ||
                liveData?.bookingDetails?.clientName ||
                liveData?.bookingDetails?.customerName ||
                liveData?.clientDetails?.name ||
                liveData?.clientDetails?.clientName ||
                liveData?.guestName ||
                localClient?.name ||
                localClient?.client_name ||
                localClient?.full_name ||
                (itinerary as any)?.clients?.name ||
                (itinerary as any)?.clients?.client_name ||
                (itinerary as any)?.client?.name ||
                itinerary?.client_name ||
                itinerary?.client_names ||
                itinerary?.guest_names ||
                "Valued Guest"
            )
            : undefined;

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
            title: liveData?.tripTitle || liveData?.title || itinerary?.title,
            clientName: resolvedClientName,
            agencySettings: effectiveAgencySettings,
            userProfile: effectiveUserProfile,
            agent,
            hotels: validHotels,
            flights: validFlights,
            cabs: validCabs,
            buses: validBuses,
            finalTotal: resolvedFinalTotal,
            pricing: pricingCfg,
            baseCost: calculatedBase,
            // liveData (itinerary_data) is the single source of truth for all content fields.
            // itinerary is the DB row shell (used for IDs, client_id etc), not for content.
            showTimestamps: liveData?.showTimestamps ?? itinerary?.show_timestamps ?? true,
            inclusions: liveData?.inclusions,
            exclusions: liveData?.exclusions,
            termsAndConditions: liveData?.termsAndConditions,
            cancellationPolicy: liveData?.cancellationPolicy,
            paymentMethods: liveData?.paymentMethods,
            aboutPlace: liveData?.aboutPlace,
            isHtmlEditor: true,
            daySummaries: liveData?.daySummaries || [],
        };
    }, [liveData, itinerary, userProfile, agencySettings, localUserProfile, localAgencySettings, localClient]);

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
                onToggleEdit={handleToggleEdit}
                onAddDay={handleAddDay}
                editMode={editMode}
                itineraryTitle={itinerary?.title || ""}
                onBack={() => router.back()}
                selectedTheme={selectedTheme}
                onThemeChange={handleThemeChange}
            />

            {/* Edit mode hint banner */}
            {editMode && (
                <div className="fixed top-14 left-0 right-0 z-[9998] bg-zinc-950/80 border-b border-zinc-800/80 backdrop-blur-md py-2 px-6 text-xs font-medium text-zinc-400 text-center animate-in fade-in duration-200">
                    Click any highlighted field to edit inline · Changes sync to DB & PDF export
                </div>
            )}

            {/* Floating context toolbar */}
            <FloatingToolbar
                editMode={editMode}
                onOpenImagePicker={handleOpenImagePicker}
                onUpdateTime={handleUpdateTime}
            />

            {/* Sidebar structure navigator */}
            <StructuralControls
                editMode={editMode}
                liveData={liveData}
                onReorderDays={handleReorderDays}
                onDeleteDay={handleDeleteDay}
                onAddDay={handleAddDay}
                onAddActivity={handleAddActivity}
                onDeleteActivity={handleDeleteActivity}
                onMoveActivity={handleMoveActivity}
                onUpdateDaySummary={handleUpdateDaySummary}
                onUpdateAboutTitle={handleUpdateAboutTitle}
                onUpdateAboutDescription={handleUpdateAboutDescription}
                onAddHighlight={handleAddHighlight}
                onDeleteHighlight={handleDeleteHighlight}
                onUpdateHighlight={handleUpdateHighlight}
                onAddInclusion={handleAddInclusion}
                onDeleteInclusion={handleDeleteInclusion}
                onAddExclusion={handleAddExclusion}
                onDeleteExclusion={handleDeleteExclusion}
                onAddTerm={handleAddTerm}
                onDeleteTerm={handleDeleteTerm}
                onAddCancellation={handleAddCancellation}
                onDeleteCancellation={handleDeleteCancellation}
                onAddPayment={handleAddPayment}
                onDeletePayment={handleDeletePayment}
                onOpenImagePicker={handleOpenImagePicker}
            />

            {/* Unsplash & Local Photo Picker Modal */}
            <ImagePicker
                open={imagePickerOpen}
                onClose={() => setImagePickerOpen(false)}
                onSelectImage={handleSelectImage}
                title={`Choose ${imageTargetField.includes("cover") ? "Cover Photo" : "Day Photo"}`}
                initialQuery={imagePickerQuery}
            />

            {/* Custom CSS for Editable Fields in Edit Mode */}
            <style jsx global>{`
                .html-editor-field-active {
                    outline: 1.5px dashed rgba(59, 130, 246, 0.45) !important;
                    outline-offset: 2px !important;
                    background-color: rgba(59, 130, 246, 0.04) !important;
                    border-radius: 6px !important;
                    cursor: text !important;
                    transition: outline 0.18s cubic-bezier(0.4, 0, 0.2, 1),
                                background-color 0.18s cubic-bezier(0.4, 0, 0.2, 1),
                                box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .html-editor-field-active:hover {
                    outline: 1.5px solid #3b82f6 !important;
                    background-color: rgba(59, 130, 246, 0.08) !important;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.15) !important;
                }
                .html-editor-field-active:focus {
                    outline: 2px solid #3b82f6 !important;
                    outline-offset: 2px !important;
                    background-color: rgba(59, 130, 246, 0.12) !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.22), 0 4px 14px rgba(0, 0, 0, 0.15) !important;
                }
            `}</style>

            {/* Itinerary render — PdfTemplate renders the selected theme.
                instrumentTheme() stamps data-field on all themes after mount. */}
            <div
                style={{ paddingTop: editMode ? 80 : 64, paddingBottom: 48, background: "#05070a", minHeight: "100vh" }}
                className="px-2 sm:px-4 transition-all duration-200 w-full overflow-x-auto"
            >
                <div ref={containerRef} className="max-w-5xl mx-auto overflow-x-auto min-w-0">
                    <PdfTemplate {...(themeProps as any)} theme={selectedTheme} />
                </div>
            </div>
        </>
    );
}
