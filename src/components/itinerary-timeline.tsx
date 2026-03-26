"use client";

import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import type { HotelInfo, FlightInfo } from "@/components/hotel-flight-editor";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Calendar, Clock, Footprints, Wallet, Pencil, Check, Trash2, Plus, GripVertical, X,
  Hotel, Plane, Star,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useContext } from "react";
import { ItineraryContext } from "@/contexts/itinerary-context";
import { getCurrencySymbol } from "@/lib/itinerary-calculator";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────────

type DayData = Omit<TravelItineraryOutput["itinerary"][number], "dailyStats"> & { 
  imageUrl?: string;
  dailyStats: { 
    totalCost: string;
    walkingDistance?: string;
  };
};
type TimelineStep = DayData["timeline"][number] & { imageUrl?: string };

type ItineraryTimelineProps = {
  itinerary: DayData[];
  isLoading?: boolean;
  showDecorations?: boolean;
  editable?: boolean;
  onItineraryChange?: (itinerary: TravelItineraryOutput["itinerary"]) => void;
  onEditingChange?: (editing: boolean) => void;
  hotels?: HotelInfo[];
  flights?: FlightInfo[];
  showTimestamps?: boolean;
};

// ── Hotel & Flight Display Blocks ──────────────────────────────────────────────

function FlightBanner({ flight }: { flight: FlightInfo }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
      <Plane className="w-4 h-4 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-primary">
            {flight.airline} {flight.flightNumber}
          </span>
          {flight.pnr && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">PNR: {flight.pnr}</span>
          )}
        </div>
        <div className="text-foreground/70 text-xs mt-0.5">
          {flight.departureAirport} → {flight.arrivalAirport}
          {(flight.departure || flight.arrival) && (
            <span className="ml-2">
              {flight.departure}{flight.departure && flight.arrival ? " – " : ""}{flight.arrival}
            </span>
          )}
          {flight.terminal && <span className="ml-2">Terminal {flight.terminal}</span>}
        </div>
      </div>
    </div>
  );
}

function HotelBanner({ hotel }: { hotel: HotelInfo }) {
  const hasImages = hotel.imageUrls && hotel.imageUrls.length > 0;
  return (
    <div className="flex flex-col gap-4 px-5 py-4 rounded-xl bg-secondary/10 border border-secondary/20 text-sm overflow-hidden">
      <div className="flex items-start gap-4">
        <Hotel className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-secondary text-base">{hotel.name || "Hotel"}</span>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: hotel.starRating }, (_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              ))}
            </span>
            {hotel.bookingRef && (
              <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-md font-medium">Ref: {hotel.bookingRef}</span>
            )}
          </div>
          <div className="text-foreground/70 text-xs mt-1">
            {hotel.address && <span>{hotel.address} • </span>}
            Check-in: {hotel.checkIn} • Check-out: {hotel.checkOut}
          </div>
        </div>
      </div>

      {hasImages && (
        <div className={cn(
          "mt-2 grid gap-3",
          hotel.imageUrls!.length === 1 ? "grid-cols-1" : "grid-cols-2"
        )}>
          {hotel.imageUrls!.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Hotel ${idx + 1}`}
              className={cn(
                "w-full object-cover rounded-lg shadow-sm border border-secondary/10",
                hotel.imageUrls!.length === 1 ? "h-64 sm:h-80" : "h-40 sm:h-48"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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

/** Container ID for a day (used for droppable) */
const dayContainerId = (dayIndex: number) => `day-container-${dayIndex}`;

// ── Inline Editable Text ───────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  className,
  inputClassName,
  multiline = false,
  placeholder = "Enter text...",
  onEditStart,
}: {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  placeholder?: string;
  onEditStart?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Sync external value changes
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (!editing) {
    return (
      <span
        className={cn("group/edit cursor-pointer inline-flex items-center gap-1.5 rounded px-1 -mx-1 transition-colors hover:bg-primary/10", className)}
        onClick={() => {
          if (onEditStart) onEditStart();
          setEditing(true);
        }}
        title="Click to edit"
      >
        <span className="flex-1">{value}</span>
        <Pencil className="w-3 h-3 text-primary/40 opacity-0 group-hover/edit:opacity-100 transition-opacity flex-shrink-0" />
      </span>
    );
  }

  const sharedProps = {
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); }
      if (e.key === "Escape") cancel();
    },
    onBlur: commit,
    className: cn(
      "bg-white/10 border border-primary/30 rounded px-2 py-1 text-inherit focus:outline-none focus:ring-2 focus:ring-primary/50 w-full",
      inputClassName
    ),
    placeholder,
  };

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        rows={3}
        {...sharedProps}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      {...sharedProps}
    />
  );
}

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
      <div className={cn(
        "absolute -left-[31px] top-6 w-6 h-6 bg-background rounded-full z-10 transition-transform group-hover/step:scale-110",
        stepIndex % 3 === 0 ? "border-[5px] border-primary shadow-[0_0_15px_rgba(255,92,51,0.4)]" : 
        stepIndex % 3 === 1 ? "border-[5px] border-accent shadow-[0_0_15px_rgba(236,72,153,0.4)]" :
        "border-[5px] border-secondary shadow-[0_0_15px_rgba(124,58,237,0.4)]"
      )}></div>

      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {isEditable && (
          <button
            className="mt-6 cursor-grab active:cursor-grabbing text-primary/30 hover:text-primary/70 transition-colors opacity-0 group-hover/step:opacity-100"
            {...attributes}
            {...listeners}
            tabIndex={-1}
            aria-label="Drag to reorder"
          >
            <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
          </button>
        )}

        <div className="flex-1 min-w-0">
            <div className="glass-panel p-2 sm:p-3 rounded-xl flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center group/card transition-all">
              <div className="hidden sm:flex w-14 h-14 rounded-md overflow-hidden flex-shrink-0 shadow-lg border border-white/5 bg-zinc-900/50">
                {/* Fallback image with Unsplash ID depending on step Index so they are visually unique and pretty */}
                <img 
                  className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 brightness-[0.8]" 
                  src={step.imageUrl || `https://images.unsplash.com/photo-${1542104595 + (stepIndex * 1500)}?q=80&w=1000&auto=format&fit=crop`} 
                  alt="Activity"
                />
              </div>
              
              <div className="flex-1 w-full min-w-0">
                <div className="flex justify-between items-start mb-2">
                  {showTimestamps !== false ? (
                    <InlineEdit
                      value={step.time}
                      onSave={(v) => onUpdateStep("time", v)}
                      onEditStart={() => onEditingChange?.(true)}
                      className="text-[10px] font-black text-primary tracking-widest uppercase block mt-0.5"
                      inputClassName="text-[10px] font-black"
                      placeholder="e.g. 08:00 AM"
                    />
                  ) : <div className="text-[10px] font-black text-primary tracking-widest uppercase opacity-0 mt-0.5">-</div>}
                  
                  <div className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[9px] font-black shadow-lg flex items-center gap-1">
                    <span>{currencySymbol ?? "₹"}</span>
                    <InlineEdit
                      value={step.cost !== undefined ? String(step.cost) : ""}
                      onSave={(v) => onUpdateStep("cost", v ? Number(v) : undefined)}
                      onEditStart={() => onEditingChange?.(true)}
                      className="min-w-[1.5rem]"
                      inputClassName="text-[9px]"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <InlineEdit
                  value={step.details}
                  onSave={(v) => onUpdateStep("details", v)}
                  onEditStart={() => onEditingChange?.(true)}
                  className="text-slate-300 text-[13px] leading-tight mb-2 font-medium block"
                  multiline
                  placeholder="Activity description..."
                />

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[8px] font-black text-secondary uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {step.details.split('at')[1]?.trim().split(' ')[0] || "Ubud"}
                  </span>
                  <span className="flex items-center gap-1 text-[8px] font-black text-accent uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
                    Pick
                  </span>
                </div>
              </div>
            </div>
        </div>

        {/* Delete button */}
        {isEditable && (
          <button
            onClick={onDeleteStep}
            className="mt-1 text-red-400/50 hover:text-red-400 transition-colors opacity-0 group-hover/step:opacity-100"
            title="Delete activity"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
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
  <div className="relative space-y-8">
    <div className="absolute left-3 top-2 h-full w-0.5 bg-primary/20" />
    {[...Array(3)].map((_, index) => (
      <div key={index} className="relative flex items-start space-x-6">
        <div className="flex-shrink-0">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="flex-grow">
          <Card className="glass-card animate-pulse">
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
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
  hotels = [],
  flights = [],
  showTimestamps = true,
}: ItineraryTimelineProps) => {
  const { toast } = useToast();

  // Derive currency symbol from ItineraryContext when available (e.g. inside ClientItineraryEditor).
  // Falls back to "₹" for standalone/read-only usage (PDF preview, trip cards, etc.).
  const itineraryCtx = useContext(ItineraryContext);
  const currencySymbol = itineraryCtx
    ? getCurrencySymbol(itineraryCtx.state.pricing.currency)
    : "₹";
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  // Track which container the dragged item is currently over
  const [overDayIndex, setOverDayIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Mutation helpers (all call onItineraryChange) ──

  const updateItinerary = useCallback(
    (updater: (days: DayData[]) => DayData[]) => {
      if (!onItineraryChange) return;
      const updated = updater(JSON.parse(JSON.stringify(itinerary)));
      onItineraryChange(updated);
    },
    [itinerary, onItineraryChange]
  );

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
            updateItinerary((days) => {
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

  const updateDailyStat = (dayIndex: number, field: "totalCost" | "walkingDistance", value: string) => {
    if (onEditingChange) onEditingChange(true);
    updateItinerary((days) => {
      (days[dayIndex].dailyStats as any)[field] = value;
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
        dailyStats: { totalCost: "₹0" },
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
            updateItinerary((days) => {
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

  // ── Drag handlers ──

  const findStepByDragId = (id: string): TimelineStep | null => {
    const parsed = parseStepId(id);
    if (!parsed) return null;
    return itinerary[parsed.dayIndex]?.timeline[parsed.stepIndex] ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveStepId(event.active.id as string);
    if (onEditingChange) onEditingChange(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) { setOverDayIndex(null); return; }

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeParsed = parseStepId(activeId);
    const overParsed = parseStepId(overId);

    if (!activeParsed || !overParsed) return;

    // Figure out which day we're over
    setOverDayIndex(overParsed.dayIndex);

    // If different day or different position, move it in real-time for visual feedback
    if (activeParsed.dayIndex !== overParsed.dayIndex || activeParsed.stepIndex !== overParsed.stepIndex) {
      updateItinerary((days) => {
        if (activeParsed.dayIndex === overParsed.dayIndex) {
          days[activeParsed.dayIndex].timeline = arrayMove(
            days[activeParsed.dayIndex].timeline,
            activeParsed.stepIndex,
            overParsed.stepIndex
          );
        } else {
          const [movedStep] = days[activeParsed.dayIndex].timeline.splice(activeParsed.stepIndex, 1);
          days[overParsed.dayIndex].timeline.splice(overParsed.stepIndex, 0, movedStep);
        }
        return days;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveStepId(null);
    setOverDayIndex(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeParsed = parseStepId(activeId);
    const overParsed = parseStepId(overId);

    if (!activeParsed || !overParsed) return;

    updateItinerary((days) => {
      if (activeParsed.dayIndex === overParsed.dayIndex) {
        // Same day reorder
        const dayTimeline = days[activeParsed.dayIndex].timeline;
        days[activeParsed.dayIndex].timeline = arrayMove(
          dayTimeline,
          activeParsed.stepIndex,
          overParsed.stepIndex
        );
      } else {
        // Cross-day move
        const [movedStep] = days[activeParsed.dayIndex].timeline.splice(activeParsed.stepIndex, 1);
        days[overParsed.dayIndex].timeline.splice(overParsed.stepIndex, 0, movedStep);
      }
      return days;
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
      <div className="flex gap-4 overflow-x-auto pb-8 mb-10 mt-2 snap-x">
        {itinerary.map((day, dIdx) => (
          <button
            key={dIdx}
            onClick={() => {
              document.getElementById(`day-container-${dIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex-shrink-0 liquid-glass p-5 rounded-[1.5rem] w-44 text-left transition-all group hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 snap-start"
          >
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 transition-colors">
              Day {String(dIdx + 1).padStart(2, '0')}
            </p>
            <p className="text-sm font-bold text-white/90 truncate">{day.areaFocus}</p>
          </button>
        ))}
        {editable && (
          <button
            onClick={addDay}
            className="flex-shrink-0 p-5 rounded-[1.5rem] w-44 text-left transition-all border-2 border-dashed border-white/10 hover:border-primary/40 hover:bg-white/5 flex flex-col justify-center items-center gap-2 text-zinc-500 hover:text-primary snap-start"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-widest">Add Day</span>
          </button>
        )}
      </div>

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
                    "glass-panel rounded-3xl overflow-hidden transition-all shadow-2xl border-white/5",
                    editable && "ring-1 ring-primary/20"
                  )}>
                    <CardHeader className="bg-obsidian-dark/40 border-b border-white/5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div>
                            {editable ? (
                              <>
                                <InlineEdit
                                  value={day.date}
                                  onSave={(v) => updateDayField(dayIndex, "date", v)}
                                  onEditStart={() => onEditingChange?.(true)}
                                  className="text-xs font-bold text-zinc-500 uppercase tracking-widest"
                                  inputClassName="text-xs"
                                />
                                <div className="flex items-baseline gap-2">
                                  <span className="text-4xl font-extrabold text-white tracking-tight">Day {day.day}:</span>
                                  <InlineEdit
                                    value={day.areaFocus}
                                    onSave={(v) => updateDayField(dayIndex, "areaFocus", v)}
                                    onEditStart={() => onEditingChange?.(true)}
                                    className="text-4xl font-extrabold text-white tracking-tight block"
                                    inputClassName="text-3xl font-bold"
                                    placeholder="Area focus..."
                                  />
                                </div>
                              </>
                            ) : (
                              <h3 className="text-xl font-extrabold text-white tracking-tight">
                                Day {String(day.day).padStart(2, '0')}: <span className="text-gradient">{day.areaFocus}</span>
                              </h3>
                            )}
                          </div>
                        </div>

                        {/* Delete day button */}
                        {editable && itinerary.length > 1 && (
                          <button
                            onClick={() => deleteDay(dayIndex)}
                            className="ml-2 p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Delete this day"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="py-3 sm:py-4 font-body">
                      <SortableContext
                        items={dayStepIds}
                        strategy={verticalListSortingStrategy}
                        disabled={!editable}
                      >
                        <div className="relative timeline-line space-y-3 pl-4 sm:pl-10">
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

                    <CardFooter 
                      className="mt-1 ml-0 sm:ml-12 p-0 bg-transparent border-none"
                      style={{ borderLeftWidth: "24px", paddingLeft: "24px", paddingRight: "24px", marginBottom: "10px", marginRight: "10px" }}
                    >
                      <div className="w-full py-1.5 px-0 bg-transparent flex justify-between items-center text-[10px] font-medium border-none">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-zinc-500">
                             <Footprints className="w-3.5 h-3.5 text-zinc-400" />
                             {editable ? (
                                <InlineEdit
                                  value={day.dailyStats.walkingDistance || ""}
                                  onSave={(v) => updateDailyStat(dayIndex, "walkingDistance", v)}
                                  onEditStart={() => onEditingChange?.(true)}
                                  className="text-[10px]"
                                  inputClassName="text-[10px]"
                                />
                             ) : <span>{day.dailyStats.walkingDistance} Walk</span>}
                          </div>
                        </div>
                        <div className="text-zinc-300 font-bold">
                           Total Day {day.day}: <span className="text-white">
                             {editable ? (
                                <InlineEdit
                                  value={day.dailyStats.totalCost}
                                  onSave={(v) => updateDailyStat(dayIndex, "totalCost", v)}
                                  className="text-white"
                                  inputClassName="text-white"
                                />
                             ) : day.dailyStats.totalCost}
                           </span>
                        </div>
                      </div>
                    </CardFooter>
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

      {/* Global Flights & Accommodations Summary */}
      {(flights.length > 0 || hotels.length > 0) && (
        <div className="relative flex items-start gap-6 sm:gap-12 mt-16 sm:flex-row">

          <div className="flex-1">
            <Card className="glass-card overflow-hidden">
              <CardHeader className="bg-white/5">
                <CardTitle className="font-headline text-3xl text-primary">Flights & Accommodations</CardTitle>
              </CardHeader>
              <CardContent className="py-6 space-y-8">
                {flights.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-foreground/80">Flight Details</h4>
                    <div className="space-y-2">
                      {flights.map(flight => (
                        <FlightBanner key={flight.id} flight={flight} />
                      ))}
                    </div>
                  </div>
                )}
                {hotels.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-foreground/80">Hotel Details</h4>
                    <div className="space-y-2">
                      {hotels.map(hotel => (
                        <HotelBanner key={hotel.id} hotel={hotel} />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default ItineraryTimeline;
