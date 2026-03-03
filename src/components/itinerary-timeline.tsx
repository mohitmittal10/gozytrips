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
import { useState, useRef, useEffect, useCallback } from "react";
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

type DayData = TravelItineraryOutput["itinerary"][number];
type TimelineStep = DayData["timeline"][number];

type ItineraryTimelineProps = {
  itinerary: TravelItineraryOutput["itinerary"];
  isLoading?: boolean;
  showDecorations?: boolean;
  editable?: boolean;
  onItineraryChange?: (itinerary: TravelItineraryOutput["itinerary"]) => void;
  hotels?: HotelInfo[];
  flights?: FlightInfo[];
};

// ── Hotel & Flight Display Blocks ──────────────────────────────────────────────

function FlightBanner({ flight }: { flight: FlightInfo }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
      <Plane className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-emerald-400">
            {flight.airline} {flight.flightNumber}
          </span>
          {flight.pnr && (
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">PNR: {flight.pnr}</span>
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
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
      <Hotel className="w-4 h-4 text-blue-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-blue-400">{hotel.name || "Hotel"}</span>
          <span className="flex items-center gap-0.5">
            {Array.from({ length: hotel.starRating }, (_, i) => (
              <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            ))}
          </span>
          {hotel.bookingRef && (
            <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Ref: {hotel.bookingRef}</span>
          )}
        </div>
        <div className="text-foreground/70 text-xs mt-0.5">
          {hotel.address && <span>{hotel.address} • </span>}
          Check-in: {hotel.checkIn} • Check-out: {hotel.checkOut}
        </div>
      </div>
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
}: {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  placeholder?: string;
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
        onClick={() => setEditing(true)}
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
}: {
  id: string;
  stepIndex: number;
  step: TimelineStep;
  isEditable: boolean;
  onUpdateStep: (field: keyof TimelineStep, value: string | number | undefined) => void;
  onDeleteStep: () => void;
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
    <div ref={setNodeRef} style={style} className="relative pl-8 group/step">
      <div className="absolute left-0 top-1.5 h-full border-l-2 border-dashed border-primary/30" />
      <div className="absolute -left-3 top-0 flex items-center justify-center w-6 h-6 bg-primary rounded-full text-primary-foreground font-bold text-xs">
        {stepIndex + 1}
      </div>

      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {isEditable && (
          <button
            className="mt-1 cursor-grab active:cursor-grabbing text-primary/30 hover:text-primary/70 transition-colors opacity-0 group-hover/step:opacity-100"
            {...attributes}
            {...listeners}
            tabIndex={-1}
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {isEditable ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <InlineEdit
                  value={step.time}
                  onSave={(v) => onUpdateStep("time", v)}
                  className="font-bold text-primary text-lg"
                  inputClassName="text-lg font-bold"
                  placeholder="e.g. 9:00 AM"
                />
                <div className="flex items-center gap-2 bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                  <span className="text-xs font-semibold text-primary/60">Cost</span>
                  <InlineEdit
                    value={step.cost !== undefined ? String(step.cost) : ""}
                    onSave={(v) => onUpdateStep("cost", v ? Number(v) : undefined)}
                    className="text-sm font-semibold text-primary min-w-[3rem]"
                    inputClassName="text-sm font-semibold"
                    placeholder="0"
                  />
                </div>
              </div>
              <InlineEdit
                value={step.details}
                onSave={(v) => onUpdateStep("details", v)}
                className="text-foreground/80 mt-1 block"
                multiline
                placeholder="Activity description..."
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="font-bold text-primary text-lg">{step.time}</p>
                {step.cost !== undefined && (
                  <p className="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">₹{step.cost}</p>
                )}
              </div>
              <p className="text-foreground/80 mb-4">{step.details}</p>
            </>
          )}
        </div>

        {/* Delete button */}
        {isEditable && (
          <button
            onClick={onDeleteStep}
            className="mt-1 text-red-400/50 hover:text-red-400 transition-colors opacity-0 group-hover/step:opacity-100"
            title="Delete activity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Activity Overlay (shown while dragging) ────────────────────────────────────

function ActivityOverlay({ step }: { step: TimelineStep }) {
  return (
    <div className="bg-primary/20 backdrop-blur-md border border-primary/40 rounded-lg px-4 py-3 shadow-2xl max-w-md">
      <p className="font-bold text-primary text-lg">{step.time}</p>
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
  hotels = [],
  flights = [],
}: ItineraryTimelineProps) => {
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
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
    updateItinerary((days) => {
      const newStep: TimelineStep = { time: "12:00 PM", details: "New activity — click to edit" };
      const idx = insertAt ?? days[dayIndex].timeline.length;
      days[dayIndex].timeline.splice(idx, 0, newStep);
      return days;
    });
  };

  const updateDayField = (dayIndex: number, field: "areaFocus" | "date", value: string) => {
    updateItinerary((days) => {
      (days[dayIndex] as Record<string, unknown>)[field] = value;
      return days;
    });
  };

  const updateDailyStat = (dayIndex: number, field: "totalCost" | "walkingDistance", value: string) => {
    updateItinerary((days) => {
      days[dayIndex].dailyStats[field] = value;
      return days;
    });
  };

  const addDay = () => {
    updateItinerary((days) => {
      const lastDay = days[days.length - 1];
      const newDay: DayData = {
        day: days.length + 1,
        date: `Day ${days.length + 1}`,
        areaFocus: "New Area — click to edit",
        imageSearchTerm: "",
        timeline: [{ time: "9:00 AM", details: "First activity — click to edit" }],
        dailyStats: { totalCost: "₹0", walkingDistance: "0 km" },
      };
      days.push(newDay);
      return days;
    });
  };

  const deleteDay = (dayIndex: number) => {
    if (itinerary.length <= 1) return;
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
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) { setOverDayIndex(null); return; }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeParsed = parseStepId(activeId);
    const overParsed = parseStepId(overId);

    if (!activeParsed) return;

    // Figure out which day we're over
    if (overParsed) {
      setOverDayIndex(overParsed.dayIndex);
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
    <div className="relative w-full max-w-5xl mx-auto py-8">
      {/* Edit mode toggle */}
      {editable && (
        <div className="flex justify-end mb-6 sticky top-20 z-30">
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              "gap-2 transition-all shadow-lg",
              isEditMode
                ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0"
                : "glass-button border-primary/30 text-primary hover:bg-primary/10"
            )}
          >
            {isEditMode ? (
              <>
                <Check className="w-4 h-4" />
                Done Editing
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
                Edit Itinerary
              </>
            )}
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-16">
          {showDecorations && (
            <div className="absolute left-5 sm:left-9 top-4 h-[calc(100%-2rem)] w-1 bg-primary/20" />
          )}

          {itinerary.map((day, dayIndex) => {
            const dayStepIds = day.timeline.map((_, stepIdx) => stepId(dayIndex, stepIdx));
            const dayFlights = flights.filter((f) => f.dayIndex === dayIndex);
            const dayHotels = hotels.filter((h) => h.dayIndex === dayIndex);

            return (
              <div
                key={`day-${dayIndex}`}
                className={cn(
                  "relative flex items-start gap-6 sm:gap-12",
                  dayIndex % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                )}
              >
                <div className="relative flex-shrink-0">
                  {showDecorations && (
                    <div className="bg-background ring-4 ring-primary rounded-full p-2 absolute -left-1.5 top-0 z-10 sm:left-9 sm:-translate-x-1/2">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Card className={cn(
                    "glass-card ai-architect-page-card overflow-hidden transition-all",
                    isEditMode && "ring-1 ring-primary/20"
                  )}>
                    <CardHeader className="bg-white/5">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          {isEditMode ? (
                            <>
                              <InlineEdit
                                value={`Day ${day.day} - ${day.date}`}
                                onSave={(v) => {
                                  // Parse out the date part after "Day X - "
                                  const match = v.match(/^Day\s*\d+\s*-\s*(.+)$/);
                                  if (match) updateDayField(dayIndex, "date", match[1].trim());
                                  else updateDayField(dayIndex, "date", v);
                                }}
                                className="font-headline text-lg text-primary/80"
                                inputClassName="text-lg"
                              />
                              <InlineEdit
                                value={day.areaFocus}
                                onSave={(v) => updateDayField(dayIndex, "areaFocus", v)}
                                className="font-headline text-3xl text-primary block mt-1"
                                inputClassName="text-2xl font-bold"
                                placeholder="Area focus..."
                              />
                            </>
                          ) : (
                            <>
                              <p className="font-headline text-lg text-primary/80">Day {day.day} - {day.date}</p>
                              <CardTitle className="font-headline text-3xl text-primary">{day.areaFocus}</CardTitle>
                            </>
                          )}
                        </div>

                        {/* Delete day button */}
                        {isEditMode && itinerary.length > 1 && (
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

                    <CardContent className="py-6">
                      {/* Flight blocks at start of day */}
                      {dayFlights.length > 0 && (
                        <div className="space-y-2 mb-6">
                          {dayFlights.map((flight) => (
                            <FlightBanner key={flight.id} flight={flight} />
                          ))}
                        </div>
                      )}
                      <SortableContext
                        items={dayStepIds}
                        strategy={verticalListSortingStrategy}
                        disabled={!isEditMode}
                      >
                        <div className="space-y-8">
                          {day.timeline.map((step, stepIndex) => (
                            <SortableActivity
                              key={stepId(dayIndex, stepIndex)}
                              id={stepId(dayIndex, stepIndex)}
                              stepIndex={stepIndex}
                              step={step}
                              isEditable={isEditMode}
                              onUpdateStep={(field, value) => updateStep(dayIndex, stepIndex, field, value)}
                              onDeleteStep={() => deleteStep(dayIndex, stepIndex)}
                            />
                          ))}
                        </div>
                      </SortableContext>

                      {/* Add activity button */}
                      {isEditMode && (
                        <AddActivityButton onClick={() => addStep(dayIndex)} />
                      )}

                      {/* Hotel blocks at end of day */}
                      {dayHotels.length > 0 && (
                        <div className="space-y-2 mt-6">
                          {dayHotels.map((hotel) => (
                            <HotelBanner key={hotel.id} hotel={hotel} />
                          ))}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="bg-white/5 grid grid-cols-2 gap-4 text-xs p-4">
                      {isEditMode ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-primary" />
                            <InlineEdit
                              value={day.dailyStats.totalCost}
                              onSave={(v) => updateDailyStat(dayIndex, "totalCost", v)}
                              className="text-xs"
                              inputClassName="text-xs"
                              placeholder="e.g. ₹5,000"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Footprints className="w-4 h-4 text-primary" />
                            <InlineEdit
                              value={day.dailyStats.walkingDistance}
                              onSave={(v) => updateDailyStat(dayIndex, "walkingDistance", v)}
                              className="text-xs"
                              inputClassName="text-xs"
                              placeholder="e.g. 5 km"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-primary" />
                            <span>{day.dailyStats.totalCost} Total</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Footprints className="w-4 h-4 text-primary" />
                            <span>{day.dailyStats.walkingDistance} Walk</span>
                          </div>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeStep ? <ActivityOverlay step={activeStep} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Add day button */}
      {isEditMode && (
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
