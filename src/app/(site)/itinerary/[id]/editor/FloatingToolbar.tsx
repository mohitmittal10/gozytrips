"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bold, Italic, Clock, Camera, Check } from "lucide-react";

interface FloatingToolbarProps {
    editMode: boolean;
    onOpenImagePicker?: (initialQuery?: string, targetField?: string) => void;
    onUpdateTime?: (dayIdx: number, actIdx: number, newTime: string) => void;
}

export function FloatingToolbar({
    editMode,
    onOpenImagePicker,
    onUpdateTime,
}: FloatingToolbarProps) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [activeField, setActiveField] = useState<string | null>(null);
    const [activeImageField, setActiveImageField] = useState<string | null>(null);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timeValue, setTimeValue] = useState("09:00 AM");

    const updatePosition = useCallback(() => {
        if (!editMode) {
            setVisible(false);
            return;
        }

        const activeEl = document.activeElement as HTMLElement | null;
        if (!activeEl) {
            setVisible(false);
            return;
        }

        const field = activeEl.getAttribute("data-field");
        const imageField = activeEl.getAttribute("data-image-field");

        if (!field && !imageField) {
            setVisible(false);
            return;
        }

        setActiveField(field);
        setActiveImageField(imageField);

        const rect = activeEl.getBoundingClientRect();
        // Position toolbar floating centered above the focused element
        const top = Math.max(68, rect.top - 48);
        const maxLeft = typeof window !== 'undefined' ? window.innerWidth - 200 : 300;
        const left = Math.max(8, Math.min(maxLeft, rect.left + rect.width / 2 - 100));

        setCoords({ top, left });
        setVisible(true);
    }, [editMode]);

    useEffect(() => {
        if (!editMode) {
            setVisible(false);
            return;
        }

        const handleSelectionOrFocus = () => {
            updatePosition();
        };

        document.addEventListener("selectionchange", handleSelectionOrFocus);
        document.addEventListener("focusin", handleSelectionOrFocus);
        window.addEventListener("scroll", handleSelectionOrFocus, { passive: true });
        window.addEventListener("resize", handleSelectionOrFocus);

        return () => {
            document.removeEventListener("selectionchange", handleSelectionOrFocus);
            document.removeEventListener("focusin", handleSelectionOrFocus);
            window.removeEventListener("scroll", handleSelectionOrFocus);
            window.removeEventListener("resize", handleSelectionOrFocus);
        };
    }, [editMode, updatePosition]);

    const handleBold = (e: React.MouseEvent) => {
        e.preventDefault();
        document.execCommand("bold", false);
    };

    const handleItalic = (e: React.MouseEvent) => {
        e.preventDefault();
        document.execCommand("italic", false);
    };

    // Extract dayIdx and actIdx from activeField e.g. "days[0].activities[1]"
    const actMatch = activeField ? activeField.match(/days\[(\d+)\]\.activities\[(\d+)\]/) : null;

    const handleConfirmTime = () => {
        if (actMatch && onUpdateTime) {
            const dayIdx = parseInt(actMatch[1], 10);
            const actIdx = parseInt(actMatch[2], 10);
            onUpdateTime(dayIdx, actIdx, timeValue);
        }
        setShowTimePicker(false);
    };

    if (!editMode || !visible) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
            }}
            className="z-[9999] bg-white dark:bg-zinc-950/95 border border-slate-300 dark:border-zinc-800 rounded-xl p-1 shadow-2xl flex items-center gap-1 backdrop-blur-xl font-sans animate-in fade-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.preventDefault()} // Keep focus on contenteditable
        >
            {/* Bold */}
            <button
                onClick={handleBold}
                title="Bold (Ctrl+B)"
                className="p-1.5 rounded-lg text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer flex items-center"
            >
                <Bold size={14} />
            </button>

            {/* Italic */}
            <button
                onClick={handleItalic}
                title="Italic (Ctrl+I)"
                className="p-1.5 rounded-lg text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer flex items-center"
            >
                <Italic size={14} />
            </button>

            <div className="w-[1px] h-4 bg-slate-200 dark:bg-zinc-800 mx-0.5" />

            {/* Time Edit Button for Activities */}
            {actMatch && (
                <div className="relative">
                    <button
                        onClick={() => setShowTimePicker((prev) => !prev)}
                        title="Edit Activity Time"
                        className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            showTimePicker
                                ? "bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white"
                                : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80"
                        }`}
                    >
                        <Clock size={14} className="text-slate-600 dark:text-zinc-400" />
                        <span>Time</span>
                    </button>

                    {showTimePicker && (
                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl p-2 flex items-center gap-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                            <input
                                type="text"
                                value={timeValue}
                                onChange={(e) => setTimeValue(e.target.value)}
                                placeholder="09:00 AM"
                                className="w-20 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-600 transition-colors"
                            />
                            <button
                                onClick={handleConfirmTime}
                                className="bg-primary text-primary-foreground p-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex items-center"
                            >
                                <Check size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Replace Image Button if focused element relates to an image */}
            {(activeImageField || activeField?.includes("image") || activeField === "itinerary.title") && onOpenImagePicker && (
                <button
                    onClick={() => {
                        const target = activeImageField || activeField || "cover.imageUrl";
                        onOpenImagePicker("destination photo", target);
                    }}
                    title="Replace Image"
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-800 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                    <Camera size={14} className="text-slate-600 dark:text-zinc-400" />
                    <span>Change Image</span>
                </button>
            )}
        </div>
    );
}
