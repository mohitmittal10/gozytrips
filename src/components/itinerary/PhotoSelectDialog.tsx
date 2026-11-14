"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadItineraryPhoto } from "@/lib/upload-itinerary-photo";
import { searchSiteCandidatePhotos } from "@/ai/flows/fetch-itinerary-images";
import {
  FolderArchive,
  Upload,
  Search,
  Check,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  CloudUpload,
  RefreshCw,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface ArchivedPhoto {
  id: string;
  url: string;
  title?: string | null;
  destination?: string | null;
  search_term?: string | null;
  source: "uploaded" | "generated" | string;
  created_at?: string;
}

interface PhotoSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectPhoto: (url: string) => void;
  currentPhotoUrl?: string;
  dayNumber?: number;
  dayTitle?: string;
  destination?: string;
}

export function PhotoSelectDialog({
  open,
  onClose,
  onSelectPhoto,
  currentPhotoUrl,
  dayNumber,
  dayTitle,
  destination,
}: PhotoSelectDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"archive" | "upload" | "search">("archive");

  // ── Archive State ──
  const [archivePhotos, setArchivePhotos] = useState<ArchivedPhoto[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "uploaded" | "generated">("all");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(currentPhotoUrl || null);

  // ── Upload State ──
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Search State ──
  const [searchQuery, setSearchQuery] = useState(dayTitle || destination || "");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch archive photos when dialog opens
  const fetchArchive = useCallback(async () => {
    setLoadingArchive(true);
    try {
      // 1. Fetch from database API
      const res = await fetch("/api/photos?limit=80");
      let serverPhotos: ArchivedPhoto[] = [];
      if (res.ok) {
        const json = await res.json();
        serverPhotos = json.photos || [];
      }

      // 2. Fetch local storage cached items
      let localPhotos: ArchivedPhoto[] = [];
      if (typeof window !== "undefined") {
        try {
          localPhotos = JSON.parse(localStorage.getItem("gozy_local_photo_archive") || "[]");
        } catch {
          localPhotos = [];
        }
      }

      // Merge and deduplicate by URL
      const urlMap = new Map<string, ArchivedPhoto>();
      for (const p of [...localPhotos, ...serverPhotos]) {
        if (p?.url && !urlMap.has(p.url)) {
          urlMap.set(p.url, p);
        }
      }

      const merged = Array.from(urlMap.values());
      setArchivePhotos(merged);
    } catch (err) {
      console.error("[PhotoSelectDialog] Failed to fetch archive:", err);
    } finally {
      setLoadingArchive(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchArchive();
      setSelectedUrl(currentPhotoUrl || null);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (dayTitle || destination) {
        setSearchQuery(dayTitle || destination || "");
      }
    }
  }, [open, currentPhotoUrl, dayTitle, destination, fetchArchive]);

  // Filtered Archive Photos
  const filteredArchive = useMemo(() => {
    return archivePhotos.filter((item) => {
      if (sourceFilter !== "all" && item.source !== sourceFilter) {
        return false;
      }
      if (!archiveSearch.trim()) return true;
      const q = archiveSearch.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDest = item.destination?.toLowerCase().includes(q);
      const matchSearch = item.search_term?.toLowerCase().includes(q);
      return Boolean(matchTitle || matchDest || matchSearch);
    });
  }, [archivePhotos, archiveSearch, sourceFilter]);

  // Handle file drop / select for device upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, WEBP).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image under 5MB.",
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Upload file from device and apply
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadItineraryPhoto(selectedFile);

      // Save to local archive cache
      if (typeof window !== "undefined") {
        const cached = JSON.parse(localStorage.getItem("gozy_local_photo_archive") || "[]");
        const newItem: ArchivedPhoto = {
          id: `upload-${Date.now()}`,
          url: publicUrl,
          title: selectedFile.name.replace(/\.[^/.]+$/, ""),
          destination: destination || null,
          source: "uploaded",
          created_at: new Date().toISOString(),
        };
        localStorage.setItem(
          "gozy_local_photo_archive",
          JSON.stringify([newItem, ...cached].slice(0, 100))
        );
      }

      onSelectPhoto(publicUrl);
      toast({
        title: "Photo updated & saved to archive",
        description: "The photo has been added to your permanent archive.",
      });
      onClose();
    } catch (err: any) {
      console.error("[PhotoSelectDialog] Device upload failed:", err);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err?.message || "Could not upload image from device.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Online Sights Search
  const handleOnlineSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchSiteCandidatePhotos(searchQuery.trim(), destination, 9);
      setSearchResults(results || []);
    } catch (err) {
      console.error("[PhotoSelectDialog] Online search failed:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Apply selected photo from archive or online search
  const handleApplySelected = () => {
    if (!selectedUrl) return;
    onSelectPhoto(selectedUrl);
    toast({
      title: "Photo applied",
      description: "Itinerary photo updated successfully.",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl sm:max-h-[88vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Change Itinerary Photo
                {dayNumber !== undefined && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    Day {dayNumber}
                  </span>
                )}
              </DialogTitle>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {dayTitle ? dayTitle : destination ? `Location: ${destination}` : "Select or upload a photo"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-900/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("archive")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === "archive"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm border border-slate-200/60 dark:border-zinc-700/60"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-800/40"
            )}
          >
            <FolderArchive className="w-4 h-4 text-primary" />
            <span>Photo Archive</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-zinc-700 font-bold">
              {archivePhotos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === "upload"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm border border-slate-200/60 dark:border-zinc-700/60"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-800/40"
            )}
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>From Device</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === "search"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm border border-slate-200/60 dark:border-zinc-700/60"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-800/40"
            )}
          >
            <Search className="w-4 h-4 text-blue-500" />
            <span>Search Sights</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[340px] max-h-[500px]">
          {/* ── TAB 1: ARCHIVE ── */}
          {activeTab === "archive" && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    placeholder="Search by destination or place..."
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  {archiveSearch && (
                    <button
                      onClick={() => setArchiveSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 self-start sm:self-auto">
                  {(["all", "uploaded", "generated"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSourceFilter(filter)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors cursor-pointer",
                        sourceFilter === filter
                          ? "bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                          : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={fetchArchive}
                    title="Refresh Archive"
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", loadingArchive && "animate-spin")} />
                  </button>
                </div>
              </div>

              {/* Photo Grid */}
              {loadingArchive ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>Loading your photo archive...</span>
                </div>
              ) : filteredArchive.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredArchive.map((item) => {
                    const isSelected = selectedUrl === item.url;
                    return (
                      <div
                        key={item.id || item.url}
                        onClick={() => setSelectedUrl(item.url)}
                        className={cn(
                          "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 bg-slate-100 dark:bg-zinc-900",
                          isSelected
                            ? "border-primary ring-2 ring-primary/40 scale-[1.02] shadow-md"
                            : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.title || "Archive photo"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {/* Source Badge */}
                        <span
                          className={cn(
                            "absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-sm",
                            item.source === "uploaded"
                              ? "bg-emerald-500/80 text-white"
                              : "bg-indigo-600/80 text-white"
                          )}
                        >
                          {item.source === "uploaded" ? "Device" : "Generated"}
                        </span>

                        {/* Title Overlay */}
                        {(item.title || item.destination) && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 pt-4">
                            <p className="text-[10px] text-white font-medium truncate">
                              {item.title || item.destination}
                            </p>
                          </div>
                        )}

                        {/* Selected Checkmark */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 px-4 border border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30">
                  <FolderArchive className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    No photos found in your archive
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                    Photos generated during itinerary creation or uploaded from your device will automatically appear here for future reuse.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Photo from Device
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: UPLOAD FROM DEVICE ── */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <label
                htmlFor="device-file-input"
                className={cn(
                  "flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed rounded-2xl gap-3 transition-colors cursor-pointer",
                  previewUrl
                    ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10"
                    : "border-slate-300 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/30"
                )}
              >
                <input
                  id="device-file-input"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-emerald-500/80 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {selectedFile?.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB • Ready to upload
                      </p>
                    </div>
                    <span className="text-xs text-primary font-medium hover:underline">
                      Click to choose a different photo
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-primary shadow-sm">
                      <CloudUpload className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        Click or drag to upload from this device
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                        PNG, JPG, or WEBP up to 5MB
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-sm">
                      Select Image
                    </span>
                  </>
                )}
              </label>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>
                  Photos uploaded from your device are securely saved to your permanent Photo Archive for this and future trips.
                </span>
              </div>
            </div>
          )}

          {/* ── TAB 3: SEARCH ONLINE SIGHTS ── */}
          {activeTab === "search" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOnlineSearch()}
                  placeholder="Enter landmark or attraction (e.g. Rohtang Pass, Baga Beach)..."
                  className="flex-1 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleOnlineSearch}
                  disabled={isSearching}
                  className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </div>

              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>Searching authentic travel sights...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {searchResults.map((url, idx) => {
                    const isSelected = selectedUrl === url;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedUrl(url)}
                        className={cn(
                          "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border transition-all duration-200",
                          isSelected
                            ? "border-primary ring-2 ring-primary/40 scale-[1.02]"
                            : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Online sight candidate"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Type a landmark name and click search to view candidate photos.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === "upload" ? (
            <button
              type="button"
              onClick={handleConfirmUpload}
              disabled={!selectedFile || isUploading}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to Archive...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Apply Photo</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplySelected}
              disabled={!selectedUrl}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Use Selected Photo</span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
