"use client";

import React, { useState, useEffect } from "react";
import { fetchItineraryImages } from "@/ai/flows/fetch-itinerary-images";
import { uploadItineraryPhoto } from "@/lib/upload-itinerary-photo";
import { Search, Upload, Link as LinkIcon, Loader2, X, Check } from "lucide-react";

interface ImagePickerProps {
    open: boolean;
    onClose: () => void;
    onSelectImage: (url: string) => void;
    title?: string;
    initialQuery?: string;
}

export function ImagePicker({
    open,
    onClose,
    onSelectImage,
    title = "Choose Image",
    initialQuery = "travel destination",
}: ImagePickerProps) {
    const [tab, setTab] = useState<"unsplash" | "upload" | "url">("unsplash");
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [customUrl, setCustomUrl] = useState("");
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

    // Initial search when opened
    useEffect(() => {
        if (open && initialQuery) {
            setSearchQuery(initialQuery);
            handleSearch(initialQuery);
        }
    }, [open, initialQuery]);

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const urls = await fetchItineraryImages([query.trim()]);
            setImages(urls || []);
        } catch (err) {
            console.error("Unsplash search failed:", err);
            setImages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const uploadedUrl = await uploadItineraryPhoto(file);
            onSelectImage(uploadedUrl);
            onClose();
        } catch (err: any) {
            console.error("Upload failed:", err);
            alert(err?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmCustomUrl = () => {
        if (!customUrl.trim()) return;
        onSelectImage(customUrl.trim());
        onClose();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
                    <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-600 dark:text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1">
                    <button
                        onClick={() => setTab("unsplash")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            tab === "unsplash"
                                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                                : "text-slate-600 dark:text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                        }`}
                    >
                        <Search size={14} /> Unsplash Photos
                    </button>
                    <button
                        onClick={() => setTab("upload")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            tab === "upload"
                                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                                : "text-slate-600 dark:text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                        }`}
                    >
                        <Upload size={14} /> Upload File
                    </button>
                    <button
                        onClick={() => setTab("url")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            tab === "url"
                                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                                : "text-slate-600 dark:text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                        }`}
                    >
                        <LinkIcon size={14} /> Custom URL
                    </button>
                </div>

                {/* Tab Body */}
                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                    {tab === "unsplash" && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                                    placeholder="Search Unsplash (e.g. Paris, Beach, Mountains)..."
                                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                                />
                                <button
                                    onClick={() => handleSearch(searchQuery)}
                                    disabled={loading}
                                    className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                    {loading ? <Loader2 size={15} className="animate-spin" /> : "Search"}
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-12 text-slate-600 dark:text-zinc-400 text-xs font-medium">
                                    Fetching high-res Unsplash photos...
                                </div>
                            ) : images.length > 0 ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {images.map((imgUrl, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedUrl(imgUrl)}
                                            className={`relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border group transition-all duration-200 ${
                                                selectedUrl === imgUrl
                                                    ? "border-primary ring-2 ring-primary/40 scale-[1.02]"
                                                    : "border-zinc-800/80 hover:border-zinc-700"
                                            }`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={imgUrl}
                                                alt="Search result"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {selectedUrl === imgUrl && (
                                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                                                    <Check size={12} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-zinc-500 text-xs">
                                    No photos found. Try another search term.
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "upload" && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl gap-3 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                                <Upload size={22} />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-semibold text-zinc-200">
                                    Upload an image from your device
                                </p>
                                <p className="text-[11px] text-zinc-500 mt-1">
                                    PNG, JPG, WEBP up to 5MB
                                </p>
                            </div>
                            <label className="mt-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2 transition-all active:scale-95">
                                {uploading ? <Loader2 size={15} className="animate-spin" /> : "Choose File"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}

                    {tab === "url" && (
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-zinc-300">
                                Image Web Address (URL)
                            </label>
                            <input
                                type="url"
                                value={customUrl}
                                onChange={(e) => setCustomUrl(e.target.value)}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                            />
                            {customUrl.trim() && (
                                <div className="rounded-xl overflow-hidden max-h-48 border border-zinc-800">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={customUrl}
                                        alt="Preview"
                                        className="w-full h-48 object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = "none";
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/80 flex justify-end gap-2.5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-zinc-200 text-xs font-semibold hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    {tab === "unsplash" && selectedUrl && (
                        <button
                            onClick={() => {
                                onSelectImage(selectedUrl);
                                onClose();
                            }}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                        >
                            Use Selected Photo
                        </button>
                    )}
                    {tab === "url" && (
                        <button
                            onClick={handleConfirmCustomUrl}
                            disabled={!customUrl.trim()}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
                        >
                            Apply URL
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
