"use client";

import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Trash2, Plus, Minus, Sparkles, Camera } from "lucide-react";
import { uploadItineraryPhoto } from "@/lib/upload-itinerary-photo";
import { useState, useCallback, useContext, useEffect, useRef } from "react";
import { CustomTabs } from "@/components/ui/custom-tabs";
import { ItineraryContext } from "@/contexts/itinerary-context";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import UniqueLoading from "@/components/ui/morph-loading";
import { regenerateItineraryDay } from "@/ai/flows/generate-travel-itinerary";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import { InlineEdit } from "@/components/ui/inline-edit";
import { useItineraryDnd } from "@/hooks/use-itinerary-dnd";
import { useReferenceOptions } from "@/hooks/use-reference-options";
import { DEFAULT_FALLBACK_PHOTOS, getActivityFallbackUrl } from "@/lib/constants";

import { fetchItineraryImages } from "@/ai/flows/fetch-itinerary-images";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DayData = TravelItineraryOutput["itinerary"][number] & { 
  imageUrl?: string;
};
export type TimelineStep = DayData["timeline"][number] & { imageUrl?: string };

type ItineraryTimelineProps = {
  itinerary: DayData[];
  isLoading?: boolean;
  showDecorations?: boolean;
  editable?: boolean;
  onItineraryChange?: (itinerary: TravelItineraryOutput["itinerary"]) => void;
  onEditingChange?: (editing: boolean) => void;
  showTimestamps?: boolean;
  currency?: string;
  destinations?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Generate a unique ID for drag-and-drop. Format: "day-{dayIndex}-step-{stepIndex}" */
const stepId = (dayIndex: number, stepIndex: number) =>
  `day-${dayIndex}-step-${stepIndex}`;

/** Parse a step ID back into day and step indices */
const parseStepId = (id: string): { dayIndex: number; stepIndex: number } | null => {
  const m = id.match(/^day-(\d+)-step-(\d+)$/);
  if (!m) return null;
  return { dayIndex: Number(m[1]), stepIndex: Number(m[2]) };
};

// ── Sortable Activity Item ─────────────────────────────────────────────────────

function SortableActivity({
  id,
  stepIndex,
  step,
  isEditable,
  onUpdateStep,
  onDeleteStep,
  onEditingChange,
  showTimestamps,
  currencySymbol,
}: {
  id: string;
  stepIndex: number;
  step: TimelineStep;
  isEditable: boolean;
  onUpdateStep: (field: keyof TimelineStep, value: string | number | undefined) => void;
  onDeleteStep: () => void;
  onEditingChange?: (editing: boolean) => void;
  showTimestamps?: boolean;
  currencySymbol?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/step">
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {isEditable && (
          <button
            className="mt-1 cursor-grab active:cursor-grabbing text-primary/30 hover:text-primary/70 transition-colors opacity-0 group-hover/step:opacity-100 flex-shrink-0"
            {...attributes}
            {...listeners}
            tabIndex={-1}
            aria-label="Drag to reorder"
          >
            <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="p-2 sm:p-2.5 rounded-xl flex flex-col sm:flex-row gap-1.5 sm:gap-3 items-start sm:items-baseline group/card transition-all bg-white/[0.02] hover:bg-white/[0.04]">
            {showTimestamps !== false && (
              <div className="flex-shrink-0">
                <InlineEdit
                  value={step.time}
                  onSave={(v) => onUpdateStep("time", v)}
                  onEditStart={() => onEditingChange?.(true)}
                  className="text-[11px] font-medium text-primary tracking-wide uppercase inline-block"
                  inputClassName="text-[11px] font-medium"
                  placeholder="e.g. 08:00 AM"
                  disabled={!isEditable}
                />
              </div>
            )}

            {showTimestamps !== false && (
              <span className="hidden sm:inline text-zinc-600 text-xs select-none">—</span>
            )}
            
            <div className="flex-1 w-full min-w-0">
              <InlineEdit
                value={step.details}
                onSave={(v) => onUpdateStep("details", v)}
                onEditStart={() => onEditingChange?.(true)}
                className="text-zinc-300 text-xs leading-relaxed font-normal block"
                inputClassName="text-xs font-normal"
                multiline
                placeholder="Activity description..."
                disabled={!isEditable}
              />
            </div>
          </div>
        </div>

        {/* Delete button */}
        {isEditable && (
          <button
            onClick={onDeleteStep}
            className="mt-1 text-red-400/50 hover:text-red-400 transition-colors opacity-0 group-hover/step:opacity-100 flex-shrink-0"
            title="Delete activity"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Activity Overlay (shown while dragging) ────────────────────────────────────

function ActivityOverlay({ step, showTimestamps }: { step: TimelineStep, showTimestamps?: boolean }) {
  return (
    <div className="bg-primary/20 backdrop-blur-md border border-primary/40 rounded-lg px-4 py-3 shadow-2xl max-w-md">
      {showTimestamps !== false && <p className="font-bold text-primary text-lg">{step.time}</p>}
      <p className="text-foreground/80 text-sm line-clamp-2">{step.details}</p>
    </div>
  );
}

// ── Add Activity Button ────────────────────────────────────────────────────────

function AddActivityButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-2 mt-2 rounded-lg border-2 border-dashed border-primary/20 text-primary/50 hover:border-primary/40 hover:text-primary/80 hover:bg-primary/5 transition-all text-sm"
    >
      <Plus className="w-4 h-4" />
      Add Activity
    </button>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

const ItineraryTimelineSkeleton = () => (
  <div className="space-y-6">
    {[...Array(3)].map((_, index) => (
      <Card key={index} className="glass-panel rounded-2xl animate-pulse">
        <CardHeader className="py-3 px-4 sm:px-6">
          <Skeleton className="h-5 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-3 py-3 px-4 sm:px-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

const ItineraryTimeline = ({
  itinerary,
  isLoading,
  showDecorations = true,
  editable = false,
  onItineraryChange,
  onEditingChange,
  showTimestamps = true,
  currency,
  destinations,
}: ItineraryTimelineProps) => {
  const { toast } = useToast();

  const [regeneratingDayIndex, setRegeneratingDayIndex] = useState<number | null>(null);
  const [promptText, setPromptText] = useState("");
  const [isRegeneratingDay, setIsRegeneratingDay] = useState(false);

  const MAX_WORDS = 25;
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };
  const wordCount = getWordCount(promptText);
  const isOverLimit = wordCount > MAX_WORDS;

  const { agencySettings } = useAuth();
  const itineraryCtx = useContext(ItineraryContext);
  
  // Resolve currency code
  const currencyCode = currency 
    || itineraryCtx?.state.pricing.currency 
    || (agencySettings as any)?.default_currency;

  const currencySymbol = getCurrencySymbol((currencyCode || "INR") as any);

  // Fetch reference options for dynamic photos
  const { options: refOptions } = useReferenceOptions('activity_fallback_photos');
  const fallbackPhotos = refOptions.length > 0 
    ? refOptions.map(opt => opt.value)
    : DEFAULT_FALLBACK_PHOTOS;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Mutation helpers (all call onItineraryChange) ──

  const [uploadingDayIndex, setUploadingDayIndex] = useState<number | null>(null);
  const dayFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handleDayPhotoUpload = async (dayIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Photo too large",
        description: "Photo must be under 5MB.",
      });
      return;
    }
    setUploadingDayIndex(dayIndex);
    try {
      const publicUrl = await uploadItineraryPhoto(file);
      
      // Wait for image to preload in browser before dismissing the loading state
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = publicUrl;
      });

      if (onEditingChange) onEditingChange(true);
      updateItinerary((days) => {
        days[dayIndex] = {
          ...days[dayIndex],
          imageUrl: publicUrl,
        };
        return days;
      });
      toast({
        title: "Photo updated",
        description: `Photo for Day ${itinerary[dayIndex].day} updated.`,
      });
    } catch (err) {
      console.error('[PhotoUpload] Failed to upload day photo:', err);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not upload photo. Please try again.",
      });
    } finally {
      setUploadingDayIndex(null);
      if (dayFileInputRefs.current[dayIndex]) {
        dayFileInputRefs.current[dayIndex]!.value = '';
      }
    }
  };

  const handleRegenerateDay = async () => {
    if (regeneratingDayIndex === null) return;
    setIsRegeneratingDay(true);
    try {
      const dayIndex = regeneratingDayIndex;
      const targetDay = itinerary[dayIndex];
      const otherDays = itinerary
        .filter((_, idx) => idx !== dayIndex)
        .map((day) => `Day ${day.day}: ${day.areaFocus} - ${day.timeline.map(t => t.details).join(', ')}`)
        .join('\n');

      const tripDestinations = destinations || itinerary[0]?.areaFocus || "Destination";

      const result = await regenerateItineraryDay({
        day: targetDay.day,
        destinations: tripDestinations,
        currentDayData: {
          day: targetDay.day,
          date: targetDay.date,
          areaFocus: targetDay.areaFocus,
          timeline: targetDay.timeline.map(step => ({
            time: step.time,
            details: step.details,
            cost: step.cost
          }))
        },
        prompt: promptText.trim(),
        otherDaysSummary: otherDays
      });

      // Fetch dynamic Unsplash image for newly regenerated day
      let newImageUrl: string | undefined = undefined;
      try {
        const searchTerm = result.imageSearchTerm || result.areaFocus;
        const [fetchedUrl] = await fetchItineraryImages([searchTerm], [result.areaFocus]);
        if (fetchedUrl) newImageUrl = fetchedUrl;
      } catch (imgErr) {
        console.warn('[handleRegenerateDay] Failed to fetch image for regenerated day:', imgErr);
      }

      updateItinerary((days) => {
        days[dayIndex] = {
          ...days[dayIndex],
          areaFocus: result.areaFocus,
          timeline: result.timeline,
          imageUrl: newImageUrl || targetDay.imageUrl,
        };
        return days;
      });

      toast({
        title: "Day Regenerated",
        description: `Day ${targetDay.day} regenerated successfully.`,
      });

      setRegeneratingDayIndex(null);
    } catch (err: any) {
      console.error("Day regeneration error:", err);
      toast({
        variant: "destructive",
        title: "Regeneration Failed",
        description: err?.message || "Something went wrong while regenerating the day.",
      });
    } finally {
      setIsRegeneratingDay(false);
    }
  };

  const updateItinerary = useCallback(
    (updater: (days: DayData[]) => DayData[]) => {
      if (!onItineraryChange) return;
      const updated = updater(JSON.parse(JSON.stringify(itinerary)));
      onItineraryChange(updated);
    },
    [itinerary, onItineraryChange]
  );

  // Stable ref so toast action closures always call the *latest* updateItinerary
  // (avoids stale-closure double-add bug when undoing delete from a toast)
  const updateItineraryRef = useRef(updateItinerary);
  useEffect(() => { updateItineraryRef.current = updateItinerary; }, [updateItinerary]);

  const {
    activeStepId,
    findStepByDragId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useItineraryDnd({
    itinerary,
    updateItinerary,
    onEditingChange,
    parseStepId,
  });

  const updateStep = (dayIndex: number, stepIndex: number, field: keyof TimelineStep, value: string | number | undefined) => {
    if (onEditingChange) onEditingChange(true);
    updateItinerary((days) => {
      days[dayIndex].timeline[stepIndex] = {
        ...days[dayIndex].timeline[stepIndex],
        [field]: value,
      };
      return days;
    });
  };

  const deleteStep = (dayIndex: number, stepIndex: number) => {
    const deleted = itinerary[dayIndex].timeline[stepIndex];
    if (onEditingChange) onEditingChange(true);
    updateItinerary((days) => {
      days[dayIndex].timeline.splice(stepIndex, 1);
      return days;
    });
    toast({
      title: "Activity removed",
      description: `"${deleted.time}" was deleted.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Use stable ref to avoid stale closure using pre-deletion itinerary
            updateItineraryRef.current((days) => {
              days[dayIndex].timeline.splice(stepIndex, 0, deleted);
              return days;
            });
          }}
        >
          Undo
        </Button>
      ),
    });
  };

  const addStep = (dayIndex: number, insertAt?: number) => {
    if (onEditingChange) onEditingChange(true);
    updateItinerary((days) => {
      const newStep: TimelineStep = { time: "12:00 PM", details: "New activity — click to edit" };
      const idx = insertAt ?? days[dayIndex].timeline.length;
      days[dayIndex].timeline.splice(idx, 0, newStep);
      return days;
    });
  };

  const updateDayField = (dayIndex: number, field: "areaFocus" | "date", value: string) => {
    if (onEditingChange) onEditingChange(true);
    updateItinerary((days) => {
      (days[dayIndex] as Record<string, unknown>)[field] = value;
      return days;
    });
  };


  const addDay = () => {
    if (onEditingChange) onEditingChange(true);
    updateItinerary((days) => {
      const lastDay = days[days.length - 1];
      const newDay: DayData = {
        day: days.length + 1,
        date: `Day ${days.length + 1}`,
        areaFocus: "New Area — click to edit",
        imageSearchTerm: "",
        timeline: [{ time: "9:00 AM", details: "First activity — click to edit" }],
      };
      days.push(newDay);
      return days;
    });
  };

  const deleteDay = (dayIndex: number) => {
    if (itinerary.length <= 1) return;
    if (onEditingChange) onEditingChange(true);
    const deleted = itinerary[dayIndex];
    updateItinerary((days) => {
      days.splice(dayIndex, 1);
      // Re-number remaining days
      days.forEach((d, i) => { d.day = i + 1; });
      return days;
    });
    toast({
      title: "Day removed",
      description: `Day ${deleted.day} — ${deleted.areaFocus} was deleted.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Use stable ref to avoid stale closure using pre-deletion itinerary
            updateItineraryRef.current((days) => {
              days.splice(dayIndex, 0, deleted);
              days.forEach((d, i) => { d.day = i + 1; });
              return days;
            });
          }}
        >
          Undo
        </Button>
      ),
    });
  };

  // ── Render ──

  if (isLoading) return <ItineraryTimelineSkeleton />;
  if (!itinerary || itinerary.length === 0) return null;

  const activeStep = activeStepId ? findStepByDragId(activeStepId) : null;

  // Collect all sortable IDs for the DndContext
  const allSortableIds = itinerary.flatMap((day, dayIdx) =>
    day.timeline.map((_, stepIdx) => stepId(dayIdx, stepIdx))
  );

  return (
    <div className="relative w-full max-w-5xl mx-auto py-4">
      {/* Horizontal Day Selector */}
      <div className="flex gap-3 overflow-x-auto pb-6 mb-8 mt-2 snap-x">
        {itinerary.map((day, dIdx) => (
          <button
            key={dIdx}
            onClick={() => {
              document.getElementById(`day-container-${dIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex-shrink-0 liquid-glass p-2.5 sm:p-3 rounded-2xl w-48 text-left transition-all group hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 snap-start flex items-center gap-3 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-900/60 border border-white/10 relative">
              <img
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-[0.85]"
                src={day.imageUrl || getActivityFallbackUrl(dIdx, fallbackPhotos)}
                alt={`Day ${dIdx + 1}`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getActivityFallbackUrl((dIdx + 1), fallbackPhotos);
                  (e.currentTarget as HTMLImageElement).onerror = null;
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5 transition-colors">
                Day {String(dIdx + 1).padStart(2, '0')}
              </p>
              <p className="text-xs font-medium text-white/90 truncate">{day.areaFocus}</p>
            </div>
          </button>
        ))}
        {editable && (
          <button
            onClick={addDay}
            className="flex-shrink-0 p-3 rounded-2xl w-36 text-left transition-all border-2 border-dashed border-white/10 hover:border-primary/40 hover:bg-white/5 flex items-center justify-center gap-2 text-zinc-500 hover:text-primary snap-start"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Add Day</span>
          </button>
        )}
      </div>

      {editable && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 text-zinc-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-300">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span>
            <strong className="text-primary font-semibold">Edit Mode Active:</strong> Click directly on any day title, activity details, or time to edit them inline. Drag cards to reorder. All changes are saved automatically.
          </span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {itinerary.map((day, dayIndex) => {
            const dayStepIds = day.timeline.map((_, stepIdx) => stepId(dayIndex, stepIdx));
            return (
              <div
                id={`day-container-${dayIndex}`}
                key={`day-${dayIndex}`}
                className={cn(
                  "relative flex items-start gap-6 sm:gap-12",
                  dayIndex % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                )}
              >

                <div className="flex-1">
                  <Card className={cn(
                    "glass-panel rounded-2xl overflow-hidden transition-all shadow-xl border border-white/5",
                    editable && "ring-1 ring-primary/20"
                  )}>
                    <CardHeader className="bg-obsidian-dark/40 py-4 px-4 sm:px-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* Photo and Heading Group */}
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          {/* Day Photo */}
                          <div className="w-24 h-24 sm:w-32 sm:h-24 rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/10 flex-shrink-0 relative group/dayphoto shadow-md">
                            <img
                              className="w-full h-full object-cover group-hover/dayphoto:scale-105 transition-transform duration-500 brightness-[0.85]"
                              src={day.imageUrl || getActivityFallbackUrl(dayIndex, fallbackPhotos)}
                              alt={`Day ${day.day} - ${day.areaFocus}`}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = getActivityFallbackUrl((dayIndex + 1), fallbackPhotos);
                                (e.currentTarget as HTMLImageElement).onerror = null;
                              }}
                            />
                            {editable && (
                              <>
                                <input
                                  ref={(el) => { dayFileInputRefs.current[dayIndex] = el; }}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleDayPhotoUpload(dayIndex, e)}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); dayFileInputRefs.current[dayIndex]?.click(); }}
                                  disabled={uploadingDayIndex === dayIndex}
                                  title="Upload custom photo for this day"
                                  className={cn(
                                    "absolute inset-0 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer",
                                    uploadingDayIndex === dayIndex
                                      ? "bg-black/75 opacity-100 pointer-events-none"
                                      : "bg-black/60 opacity-0 group-hover/dayphoto:opacity-100"
                                  )}
                                >
                                  {uploadingDayIndex === dayIndex ? (
                                    <div className="flex flex-col items-center gap-1.5">
                                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                      <span className="text-[9px] text-white/90 font-medium tracking-wide">Updating…</span>
                                    </div>
                                  ) : (
                                    <>
                                      <Camera className="w-5 h-5 text-white drop-shadow" />
                                      <span className="text-[10px] text-white font-medium mt-1">Change</span>
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>

                          {/* Day Heading Info */}
                          <div className="flex-1 min-w-0">
                            {editable ? (
                              <>
                                <InlineEdit
                                  value={day.date}
                                  onSave={(v) => updateDayField(dayIndex, "date", v)}
                                  onEditStart={() => onEditingChange?.(true)}
                                  className="text-[11px] font-normal text-zinc-400 uppercase tracking-wider block"
                                  inputClassName="text-[11px] font-normal"
                                />
                                <div className="flex items-baseline gap-2 mt-0.5">
                                  <span className="text-base font-semibold text-white tracking-tight flex-shrink-0">
                                    Day {String(day.day).padStart(2, '0')}:
                                  </span>
                                  <InlineEdit
                                    value={day.areaFocus}
                                    onSave={(v) => updateDayField(dayIndex, "areaFocus", v)}
                                    onEditStart={() => onEditingChange?.(true)}
                                    className="text-base font-semibold text-white tracking-tight block"
                                    inputClassName="text-base font-semibold"
                                    placeholder="Area focus..."
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-[11px] font-normal text-zinc-400 uppercase tracking-wider block">
                                  {day.date || `Day ${String(day.day).padStart(2, '0')}`}
                                </span>
                                <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
                                  Day {String(day.day).padStart(2, '0')}: <span className="text-zinc-200 font-medium">{day.areaFocus}</span>
                                </h3>
                              </>
                            )}
                            <p className="text-xs text-zinc-500 mt-1">
                              {day.timeline.length} {day.timeline.length === 1 ? 'activity' : 'activities'} planned
                            </p>
                          </div>
                        </div>

                        {/* Actions (Sparkles & Delete) */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {/* Sparkles button */}
                          {editable && (
                            <button
                              onClick={() => {
                                setRegeneratingDayIndex(dayIndex);
                                setPromptText("");
                              }}
                              className="p-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                              title="Regenerate this day with AI"
                            >
                              <Sparkles className="w-5 h-5 animate-pulse" />
                            </button>
                          )}

                          {/* Delete day button */}
                          {editable && itinerary.length > 1 && (
                            <button
                              onClick={() => deleteDay(dayIndex)}
                              className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Delete this day"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="py-3 px-4 sm:px-6 font-body">
                      <SortableContext
                        items={dayStepIds}
                        strategy={verticalListSortingStrategy}
                        disabled={!editable}
                      >
                        <div className="space-y-2.5">
                          {day.timeline.map((step, stepIndex) => (
                            <SortableActivity
                              key={stepId(dayIndex, stepIndex)}
                              id={stepId(dayIndex, stepIndex)}
                              stepIndex={stepIndex}
                              step={step}
                              isEditable={editable}
                              onUpdateStep={(field, value) => updateStep(dayIndex, stepIndex, field, value)}
                              onDeleteStep={() => deleteStep(dayIndex, stepIndex)}
                              onEditingChange={onEditingChange}
                              showTimestamps={showTimestamps}
                              currencySymbol={currencySymbol}
                            />
                          ))}
                        </div>
                      </SortableContext>

                      {/* Add activity button */}
                      {editable && (
                        <AddActivityButton onClick={() => addStep(dayIndex)} />
                      )}
                    </CardContent>

                  </Card>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeStep ? <ActivityOverlay step={activeStep} showTimestamps={showTimestamps} /> : null}
        </DragOverlay>
      </DndContext>



      {/* Add day button */}
      {editable && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={addDay}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-primary/20 text-primary/50 hover:border-primary/40 hover:text-primary/80 hover:bg-primary/5 transition-all text-sm font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Day {itinerary.length + 1}
          </button>
        </div>
      )}
      {/* AI Day Regeneration Dialog */}
      <Dialog open={regeneratingDayIndex !== null} onOpenChange={(open) => { if (!open) setRegeneratingDayIndex(null); }}>
        <DialogContent className="max-w-md w-full bg-[#0a0a0b]/95 border border-white/10 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-purple-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
              Regenerate Day {regeneratingDayIndex !== null ? regeneratingDayIndex + 1 : ""}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              Provide instructions to reshape this day's timeline. E.g. "include a scenic hike", "more outdoor adventure", "relaxed morning".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <Textarea
              placeholder="Type your prompt..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="bg-black/40 border border-white/10 text-white placeholder-zinc-500 rounded-xl focus:border-purple-500 min-h-[80px] w-full p-3 text-sm resize-none"
              maxLength={200}
              disabled={isRegeneratingDay}
            />
            <div className="flex justify-between items-center text-xs">
              <span className={cn(
                "font-semibold",
                isOverLimit ? "text-red-400" : "text-zinc-500"
              )}>
                {wordCount} / {MAX_WORDS} words
              </span>
              {isOverLimit && (
                <span className="text-red-400 font-medium">Prompt is too long (limit: {MAX_WORDS} words)</span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6 flex justify-end">
            <Button
              variant="ghost"
              onClick={() => setRegeneratingDayIndex(null)}
              disabled={isRegeneratingDay}
              className="text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateDay}
              disabled={isRegeneratingDay || !promptText.trim() || isOverLimit}
              className="bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 border-0 text-white font-medium flex items-center gap-2"
            >
              {isRegeneratingDay ? (
                <>
                  <UniqueLoading variant="morph" size="sm" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Regenerate Day
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItineraryTimeline;

