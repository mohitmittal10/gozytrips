import { useState } from "react";
import {
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { DayData, TimelineStep } from "@/components/itinerary-timeline";

export interface UseItineraryDndProps {
  itinerary: DayData[];
  updateItinerary: (updater: (days: DayData[]) => DayData[]) => void;
  onEditingChange?: (editing: boolean) => void;
  parseStepId: (id: string) => { dayIndex: number; stepIndex: number } | null;
}

export function useItineraryDnd({
  itinerary,
  updateItinerary,
  onEditingChange,
  parseStepId,
}: UseItineraryDndProps) {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [overDayIndex, setOverDayIndex] = useState<number | null>(null);

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
    if (!over) {
      setOverDayIndex(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeParsed = parseStepId(activeId);
    const overParsed = parseStepId(overId);

    if (!activeParsed || !overParsed) return;

    // Figure out which day we're over
    setOverDayIndex(overParsed.dayIndex);

    // If different day or different position, move it in real-time for visual feedback
    if (
      activeParsed.dayIndex !== overParsed.dayIndex ||
      activeParsed.stepIndex !== overParsed.stepIndex
    ) {
      updateItinerary((days) => {
        if (activeParsed.dayIndex === overParsed.dayIndex) {
          days[activeParsed.dayIndex].timeline = arrayMove(
            days[activeParsed.dayIndex].timeline,
            activeParsed.stepIndex,
            overParsed.stepIndex
          );
        } else {
          const [movedStep] = days[activeParsed.dayIndex].timeline.splice(
            activeParsed.stepIndex,
            1
          );
          days[overParsed.dayIndex].timeline.splice(
            overParsed.stepIndex,
            0,
            movedStep
          );
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
        const [movedStep] = days[activeParsed.dayIndex].timeline.splice(
          activeParsed.stepIndex,
          1
        );
        days[overParsed.dayIndex].timeline.splice(
          overParsed.stepIndex,
          0,
          movedStep
        );
      }
      return days;
    });
  };

  return {
    activeStepId,
    overDayIndex,
    findStepByDragId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}

