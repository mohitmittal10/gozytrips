import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- DATE HELPERS ---
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday as start of week
  return new Date(d.setDate(diff));
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function subMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() - amount, 1);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDate(date: Date): number {
  return date.getDate();
}

// --- TYPE DEFINITIONS ---
export interface Day {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
}

export interface GlassCalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
  minDate?: Date;
  initialViewMode?: "weekly" | "monthly";
}

// --- HELPER TO HIDE SCROLLBAR ---
const ScrollbarHide = () => (
  <style>{`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);

const WEEKDAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

// --- MAIN COMPONENT ---
export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ className, selectedDate: propSelectedDate, onDateSelect, minDate, initialViewMode = "weekly", ...props }, ref) => {
    const [viewMode, setViewMode] = React.useState<"weekly" | "monthly">(initialViewMode);
    const [currentMonth, setCurrentMonth] = React.useState<Date>(propSelectedDate || new Date());
    const [selectedDate, setSelectedDate] = React.useState<Date>(propSelectedDate || new Date());

    React.useEffect(() => {
      if (propSelectedDate) {
        setSelectedDate(propSelectedDate);
        setCurrentMonth(propSelectedDate);
      }
    }, [propSelectedDate]);

    // Generate days for Weekly view (7 days starting from startOfWeek)
    const weekDays = React.useMemo(() => {
      const weekStart = startOfWeek(currentMonth);
      const days: Day[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        days.push({
          date,
          isToday: isToday(date),
          isSelected: propSelectedDate ? isSameDay(date, propSelectedDate) : isSameDay(date, selectedDate),
        });
      }
      return days;
    }, [currentMonth, selectedDate, propSelectedDate]);

    // Generate days for Monthly view (Full 7-column grid with empty padding slots)
    const monthDaysGrid = React.useMemo(() => {
      const firstDayOfMonth = startOfMonth(currentMonth);
      const startDayIndex = firstDayOfMonth.getDay(); // 0 for Sun, 1 for Mon...
      const totalDays = getDaysInMonth(currentMonth);

      const items: Array<{ type: "empty" } | { type: "day"; day: Day }> = [];

      // Add padding empty slots before 1st of month
      for (let i = 0; i < startDayIndex; i++) {
        items.push({ type: "empty" });
      }

      // Add month days
      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
        items.push({
          type: "day",
          day: {
            date,
            isToday: isToday(date),
            isSelected: propSelectedDate ? isSameDay(date, propSelectedDate) : isSameDay(date, selectedDate),
          },
        });
      }

      return items;
    }, [currentMonth, selectedDate, propSelectedDate]);

    const handleDateClick = (date: Date) => {
      if (minDate && date < new Date(new Date(minDate).setHours(0, 0, 0, 0))) {
        return;
      }
      setSelectedDate(date);
      setCurrentMonth(date);
      onDateSelect?.(date);
    };

    const handlePrev = () => {
      if (viewMode === "monthly") {
        setCurrentMonth(subMonths(currentMonth, 1));
      } else {
        setCurrentMonth(addDays(currentMonth, -7));
      }
    };

    const handleNext = () => {
      if (viewMode === "monthly") {
        setCurrentMonth(addMonths(currentMonth, 1));
      } else {
        setCurrentMonth(addDays(currentMonth, 7));
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[360px] rounded-3xl p-5 shadow-2xl overflow-hidden",
          "bg-zinc-950/90 backdrop-blur-xl border border-white/10",
          "text-white font-sans transition-all",
          className
        )}
        {...props}
      >
        <ScrollbarHide />

        {/* Header: Weekly / Monthly Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 rounded-lg bg-black/40 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setViewMode("weekly")}
              className={cn(
                "rounded-md px-3.5 py-1 text-xs font-bold transition-all",
                viewMode === "weekly"
                  ? "bg-white text-black shadow-md"
                  : "text-white/60 hover:text-white"
              )}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setViewMode("monthly")}
              className={cn(
                "rounded-md px-3.5 py-1 text-xs font-bold transition-all",
                viewMode === "monthly"
                  ? "bg-white text-black shadow-md"
                  : "text-white/60 hover:text-white"
              )}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Date Display and Navigation */}
        <div className="my-4 flex items-center justify-between">
          <motion.p
            key={format(currentMonth, "MMMM yyyy")}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold tracking-tight text-white"
          >
            {format(currentMonth, "MMMM")}{" "}
            <span className="text-sm font-normal text-white/50">
              {format(currentMonth, "yyyy")}
            </span>
          </motion.p>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-full text-white/70 transition-colors hover:bg-white/10"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-full text-white/70 transition-colors hover:bg-white/10"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <AnimatePresence mode="wait">
          {viewMode === "weekly" ? (
            /* ── WEEKLY VIEW ── */
            <motion.div
              key="weekly-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="overflow-x-auto scrollbar-hide -mx-5 px-5 py-1"
            >
              <div className="flex space-x-3 min-w-max justify-between">
                {weekDays.map((day) => {
                  const isDisabled =
                    minDate &&
                    day.date < new Date(new Date(minDate).setHours(0, 0, 0, 0));
                  return (
                    <div
                      key={format(day.date, "yyyy-MM-dd")}
                      className="flex flex-col items-center space-y-2 flex-shrink-0"
                    >
                      <span className="text-[11px] font-bold text-white/50 uppercase">
                        {format(day.date, "E").charAt(0)}
                      </span>
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleDateClick(day.date)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 relative",
                          {
                            "bg-gradient-to-br from-pink-500 to-orange-400 text-white shadow-lg shadow-orange-500/20 scale-105":
                              day.isSelected,
                            "hover:bg-white/20 text-white":
                              !day.isSelected && !isDisabled,
                            "opacity-30 cursor-not-allowed text-white/40":
                              isDisabled,
                          }
                        )}
                      >
                        {day.isToday && !day.isSelected && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-pink-400"></span>
                        )}
                        {getDate(day.date)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* ── MONTHLY VIEW ── */
            <motion.div
              key="monthly-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="py-1"
            >
              {/* Day Name Headers (S M T W T F S) */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {WEEKDAY_NAMES.map((name, index) => (
                  <span
                    key={`${name}-${index}`}
                    className="text-[11px] font-bold text-white/50 uppercase"
                  >
                    {name}
                  </span>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                {monthDaysGrid.map((item, index) => {
                  if (item.type === "empty") {
                    return <div key={`empty-${index}`} className="h-8 w-8" />;
                  }

                  const { day } = item;
                  const isDisabled =
                    minDate &&
                    day.date < new Date(new Date(minDate).setHours(0, 0, 0, 0));

                  return (
                    <button
                      key={format(day.date, "yyyy-MM-dd")}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleDateClick(day.date)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 relative",
                        {
                          "bg-gradient-to-br from-pink-500 to-orange-400 text-white shadow-lg shadow-orange-500/20 scale-105":
                            day.isSelected,
                          "hover:bg-white/20 text-white":
                            !day.isSelected && !isDisabled,
                          "opacity-30 cursor-not-allowed text-white/40":
                            isDisabled,
                        }
                      )}
                    >
                      {day.isToday && !day.isSelected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-pink-400"></span>
                      )}
                      {getDate(day.date)}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

GlassCalendar.displayName = "GlassCalendar";
export default GlassCalendar;
