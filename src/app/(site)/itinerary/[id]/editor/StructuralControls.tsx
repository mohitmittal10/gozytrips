"use client";

import React, { useState } from "react";
import {
    ChevronUp,
    ChevronDown,
    Trash2,
    Plus,
    Camera,
    ListChecks,
    Calendar,
    ChevronRight,
    PanelRightClose,
    PanelRightOpen,
    FileText,
    ShieldAlert,
    CreditCard,
    Globe,
    Sparkles,
    Eye,
    MoveUp,
    MoveDown
} from "lucide-react";

interface StructuralControlsProps {
    editMode: boolean;
    liveData: any;
    onReorderDays: (fromIdx: number, toIdx: number) => void;
    onDeleteDay: (dayIdx: number) => void;
    onAddDay: () => void;
    onAddActivity: (dayIdx: number) => void;
    onDeleteActivity: (dayIdx: number, actIdx: number) => void;
    onMoveActivity: (dayIdx: number, actIdx: number, dir: "up" | "down") => void;
    onUpdateDaySummary: (dayIdx: number, text: string) => void;
    onUpdateAboutTitle: (title: string) => void;
    onUpdateAboutDescription: (desc: string) => void;
    onAddHighlight: () => void;
    onDeleteHighlight: (idx: number) => void;
    onUpdateHighlight: (idx: number, text: string) => void;
    onAddInclusion: () => void;
    onDeleteInclusion: (idx: number) => void;
    onAddExclusion: () => void;
    onDeleteExclusion: (idx: number) => void;
    onAddTerm: () => void;
    onDeleteTerm: (idx: number) => void;
    onAddCancellation: () => void;
    onDeleteCancellation: (idx: number) => void;
    onAddPayment: () => void;
    onDeletePayment: (idx: number) => void;
    onOpenImagePicker: (query?: string, field?: string) => void;
}

export function StructuralControls({
    editMode,
    liveData,
    onReorderDays,
    onDeleteDay,
    onAddDay,
    onAddActivity,
    onDeleteActivity,
    onMoveActivity,
    onUpdateDaySummary,
    onUpdateAboutTitle,
    onUpdateAboutDescription,
    onAddHighlight,
    onDeleteHighlight,
    onUpdateHighlight,
    onAddInclusion,
    onDeleteInclusion,
    onAddExclusion,
    onDeleteExclusion,
    onAddTerm,
    onDeleteTerm,
    onAddCancellation,
    onDeleteCancellation,
    onAddPayment,
    onDeletePayment,
    onOpenImagePicker,
}: StructuralControlsProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<"days" | "about" | "lists">("days");
    const [expandedDayIdx, setExpandedDayIdx] = useState<number | null>(0);

    if (!editMode || !liveData) return null;

    const days = Array.isArray(liveData.itinerary) ? liveData.itinerary : [];
    const daySummaries = Array.isArray(liveData.daySummaries) ? liveData.daySummaries : [];
    const aboutPlace = liveData.aboutPlace || {};
    const highlights = Array.isArray(aboutPlace.highlights)
        ? aboutPlace.highlights
        : Array.isArray(liveData.highlights)
            ? liveData.highlights
            : [];

    const inclusions = Array.isArray(liveData.inclusions)
        ? liveData.inclusions
        : typeof liveData.inclusions === "string"
            ? liveData.inclusions.split("\n").filter(Boolean)
            : [];
    const exclusions = Array.isArray(liveData.exclusions)
        ? liveData.exclusions
        : typeof liveData.exclusions === "string"
            ? liveData.exclusions.split("\n").filter(Boolean)
            : [];
    const terms = Array.isArray(liveData.termsAndConditions) ? liveData.termsAndConditions : [];
    const cancellation = Array.isArray(liveData.cancellationPolicy) ? liveData.cancellationPolicy : [];
    const payments = Array.isArray(liveData.paymentMethods) ? liveData.paymentMethods : [];

    if (collapsed) {
        return (
            <button
                onClick={() => setCollapsed(false)}
                title="Expand Structure Navigator"
                className="fixed right-2 sm:right-4 top-20 z-[9990] bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800/90 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-xl backdrop-blur-md transition-all duration-200 active:scale-95 group"
            >
                <PanelRightOpen size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                <span>Structure Editor</span>
            </button>
        );
    }

    return (
        <aside className="fixed right-2 sm:right-4 top-20 bottom-4 sm:bottom-6 w-[calc(100vw-16px)] sm:w-[350px] max-w-[360px] z-[9990] bg-zinc-950/95 border border-zinc-800/80 rounded-2xl flex flex-col shadow-2xl backdrop-blur-2xl font-sans overflow-hidden transition-all duration-300 ease-out animate-in fade-in slide-in-from-right-4">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/80">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
                        <Calendar size={14} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-zinc-100 tracking-tight leading-none">
                            Structure Navigator
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                            Reorder days, activities & content
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setCollapsed(true)}
                    title="Collapse sidebar"
                    className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
                >
                    <PanelRightClose size={16} />
                </button>
            </div>

            {/* Segmented Tab Pill Navigation */}
            <div className="p-2 border-b border-zinc-800/80 bg-zinc-950/50">
                <div className="grid grid-cols-3 gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/60">
                    <button
                        onClick={() => setActiveTab("days")}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            activeTab === "days"
                                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                        }`}
                    >
                        <Calendar size={13} />
                        <span>Days</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("about")}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            activeTab === "about"
                                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                        }`}
                    >
                        <Globe size={13} />
                        <span>Overview</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("lists")}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            activeTab === "lists"
                                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                        }`}
                    >
                        <ListChecks size={13} />
                        <span>Policies</span>
                    </button>
                </div>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {/* DAYS & ITINERARY AT A GLANCE TAB */}
                {activeTab === "days" && (
                    <div className="space-y-3">
                        {/* Cover Image Action */}
                        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between hover:border-zinc-700/80 transition-colors">
                            <span className="text-xs font-medium text-zinc-300">Cover Hero Photo</span>
                            <button
                                onClick={() => onOpenImagePicker("cover photo", "cover.imageUrl")}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                            >
                                <Camera size={13} className="text-zinc-400" /> Change
                            </button>
                        </div>

                        {/* Days List */}
                        <div className="space-y-2">
                            {days.map((day: any, idx: number) => {
                                const isExpanded = expandedDayIdx === idx;
                                const activities = Array.isArray(day.timeline)
                                    ? day.timeline
                                    : Array.isArray(day.activities)
                                        ? day.activities
                                        : [];
                                const rawSummary = daySummaries[idx] || (day.timeline?.[0]?.details ? (day.timeline[0].details.length > 80 ? `${day.timeline[0].details.substring(0, 77)}…` : day.timeline[0].details) : "");
                                const currentSummary = rawSummary ? rawSummary.replace(/^\s*(?:\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*[-–—•]?\s*)+/gi, "").replace(/^\s*[-•◆✓✕✦\*\+]\s*/, "").trim() : "";

                                return (
                                    <div
                                        key={idx}
                                        className={`bg-zinc-900/70 border rounded-xl overflow-hidden transition-all duration-200 ${
                                            isExpanded
                                                ? "border-zinc-700 bg-zinc-900/90 shadow-lg"
                                                : "border-zinc-800/80 hover:border-zinc-700/60"
                                        }`}
                                    >
                                        {/* Day Header Row */}
                                        <div
                                            onClick={() => setExpandedDayIdx(isExpanded ? null : idx)}
                                            className="px-3 py-2.5 flex items-center justify-between cursor-pointer select-none group"
                                        >
                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                                <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </div>
                                                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                                                    Day {idx + 1}: {day.title || day.location || "Untitled"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    disabled={idx === 0}
                                                    onClick={() => onReorderDays(idx, idx - 1)}
                                                    title="Move day up"
                                                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button
                                                    disabled={idx === days.length - 1}
                                                    onClick={() => onReorderDays(idx, idx + 1)}
                                                    title="Move day down"
                                                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteDay(idx)}
                                                    title="Delete Day"
                                                    className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors ml-0.5"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Day Details */}
                                        {isExpanded && (
                                            <div className="px-3 pb-3 pt-2 border-t border-zinc-800/80 space-y-3 bg-zinc-950/40 animate-in fade-in duration-150">
                                                {/* At A Glance Summary Input */}
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                                                        <Eye size={12} className="text-zinc-400" /> Day Summary (At a Glance)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={currentSummary}
                                                        onChange={(e) => onUpdateDaySummary(idx, e.target.value)}
                                                        placeholder="Short 1-sentence summary e.g. Arrival & Sunset Beach Dinner"
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                                                    />
                                                </div>

                                                {/* Day Hero Image Action */}
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[11px] font-medium text-zinc-400">Day Photo</span>
                                                    <button
                                                        onClick={() => onOpenImagePicker(day.location || day.title || "destination", `days[${idx}].imageUrl`)}
                                                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5 transition-all"
                                                    >
                                                        <Camera size={12} className="text-zinc-500" /> Change Photo
                                                    </button>
                                                </div>

                                                {/* Activities Header */}
                                                <div className="text-[11px] font-semibold text-zinc-400 pt-1">
                                                    Activities ({activities.length})
                                                </div>

                                                {/* Activities List */}
                                                <div className="space-y-1.5">
                                                    {activities.map((act: any, aIdx: number) => {
                                                        const title = typeof act === "string" ? act : act.activityTitle || act.details || `Activity ${aIdx + 1}`;
                                                        return (
                                                            <div
                                                                key={aIdx}
                                                                className="bg-zinc-900 border border-zinc-800/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 group hover:border-zinc-700/60 transition-colors"
                                                            >
                                                                <span className="text-[11px] text-zinc-300 truncate flex-1" title={title}>
                                                                    {aIdx + 1}. {title.replace(/<[^>]*>?/gm, "")}
                                                                </span>

                                                                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                                                                    <button
                                                                        disabled={aIdx === 0}
                                                                        onClick={() => onMoveActivity(idx, aIdx, "up")}
                                                                        className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-25 transition-colors"
                                                                    >
                                                                        <ChevronUp size={12} />
                                                                    </button>
                                                                    <button
                                                                        disabled={aIdx === activities.length - 1}
                                                                        onClick={() => onMoveActivity(idx, aIdx, "down")}
                                                                        className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-25 transition-colors"
                                                                    >
                                                                        <ChevronDown size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onDeleteActivity(idx, aIdx)}
                                                                        title="Delete activity"
                                                                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors ml-0.5"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    onClick={() => onAddActivity(idx)}
                                                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    <Plus size={13} className="text-zinc-500" /> Add Activity
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Day Button */}
                        <button
                            onClick={onAddDay}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                        >
                            <Plus size={15} /> Add New Day
                        </button>
                    </div>
                )}

                {/* DESTINATION OVERVIEW TAB */}
                {activeTab === "about" && (
                    <div className="space-y-3">
                        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3 space-y-3">
                            <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                <Globe size={14} className="text-zinc-400" /> About Destination Overview
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-zinc-400">Section Title</label>
                                <input
                                    type="text"
                                    value={aboutPlace.title || liveData.title || "About The Destination"}
                                    onChange={(e) => onUpdateAboutTitle(e.target.value)}
                                    placeholder="e.g. Discovering Tropical Bali"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-zinc-400">Description</label>
                                <textarea
                                    rows={5}
                                    value={aboutPlace.description || aboutPlace.aboutText || liveData.overview || liveData.summary || ""}
                                    onChange={(e) => onUpdateAboutDescription(e.target.value)}
                                    placeholder="Enter a rich summary of the destination..."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 leading-relaxed focus:outline-none focus:border-zinc-600 transition-colors resize-y"
                                />
                            </div>
                        </div>

                        {/* Destination Highlights */}
                        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                    <Sparkles size={14} className="text-zinc-400" /> Destination Highlights ({highlights.length})
                                </span>
                                <button
                                    onClick={onAddHighlight}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all"
                                >
                                    + Add Highlight
                                </button>
                            </div>

                            <div className="space-y-2">
                                {highlights.map((hl: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={hl}
                                            onChange={(e) => onUpdateHighlight(idx, e.target.value)}
                                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                                        />
                                        <button
                                            onClick={() => onDeleteHighlight(idx)}
                                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* INCLUSIONS & POLICIES TAB */}
                {activeTab === "lists" && (
                    <div className="space-y-3">
                        {/* Inclusions */}
                        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                    <ListChecks size={14} className="text-emerald-400" /> Inclusions ({inclusions.length})
                                </span>
                                <button
                                    onClick={onAddInclusion}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all"
                                >
                                    + Add
                                </button>
                            </div>
                            <div className="space-y-1.5 pt-1">
                                {inclusions.map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between py-1 px-2 bg-zinc-950/60 rounded-lg border border-zinc-800/60">
                                        <span className="text-xs text-zinc-300 truncate flex-1">
                                            • {item}
                                        </span>
                                        <button onClick={() => onDeleteInclusion(idx)} className="text-zinc-500 hover:text-red-400 p-1 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Exclusions */}
                        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                    <ShieldAlert size={14} className="text-rose-400" /> Exclusions ({exclusions.length})
                                </span>
                                <button
                                    onClick={onAddExclusion}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all"
                                >
                                    + Add
                                </button>
                            </div>
                            <div className="space-y-1.5 pt-1">
                                {exclusions.map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between py-1 px-2 bg-zinc-950/60 rounded-lg border border-zinc-800/60">
                                        <span className="text-xs text-zinc-300 truncate flex-1">
                                            • {item}
                                        </span>
                                        <button onClick={() => onDeleteExclusion(idx)} className="text-zinc-500 hover:text-red-400 p-1 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                    <FileText size={14} className="text-amber-400" /> Terms & Conditions ({terms.length})
                                </span>
                                <button
                                    onClick={onAddTerm}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all"
                                >
                                    + Add
                                </button>
                            </div>
                            <div className="space-y-1.5 pt-1">
                                {terms.map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between py-1 px-2 bg-zinc-950/60 rounded-lg border border-zinc-800/60">
                                        <span className="text-xs text-zinc-300 truncate flex-1">
                                            • {item}
                                        </span>
                                        <button onClick={() => onDeleteTerm(idx)} className="text-zinc-500 hover:text-red-400 p-1 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                    <CreditCard size={14} className="text-purple-400" /> Payment Methods ({payments.length})
                                </span>
                                <button
                                    onClick={onAddPayment}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all"
                                >
                                    + Add
                                </button>
                            </div>
                            <div className="space-y-1.5 pt-1">
                                {payments.map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between py-1 px-2 bg-zinc-950/60 rounded-lg border border-zinc-800/60">
                                        <span className="text-xs text-zinc-300 truncate flex-1">
                                            • {item}
                                        </span>
                                        <button onClick={() => onDeletePayment(idx)} className="text-zinc-500 hover:text-red-400 p-1 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
