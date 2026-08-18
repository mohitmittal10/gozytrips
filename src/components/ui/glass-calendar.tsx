import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// --- DATE HELPERS ---
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function isSameDay(d1?: Date | null, d2?: Date | null): boolean {
  if (!d1 || !d2) return false;
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
  initialViewMode?: "monthly";
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
  ({ className, selectedDate: propSelectedDate, onDateSelect, minDate, ...props }, ref) => {
    const getInitialMonth = () => {
      if (propSelectedDate) return propSelectedDate;
      if (minDate) return minDate;
      return new Date();
    };

    const [currentMonth, setCurrentMonth] = React.useState<Date>(getInitialMonth);
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(propSelectedDate);

    React.useEffect(() => {
      setSelectedDate(propSelectedDate);
      if (propSelectedDate) {
        setCurrentMonth(propSelectedDate);
      } else if (minDate) {
        setCurrentMonth(minDate);
      }
    }, [propSelectedDate, minDate]);

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
      const activeDate = propSelectedDate !== undefined ? propSelectedDate : selectedDate;
      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
        items.push({
          type: "day",
          day: {
            date,
            isToday: isToday(date),
            isSelected: isSameDay(date, activeDate),
          },
        });
      }

      return items;
    }, [currentMonth, selectedDate, propSelectedDate]);

    const isDateDisabled = (date: Date) => {
      if (!minDate) return false;
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime();
      return d < min;
    };

    const handleDateClick = (date: Date) => {
      if (isDateDisabled(date)) return;
      setSelectedDate(date);
      setCurrentMonth(date);
      onDateSelect?.(date);
    };

    const isPrevDisabled = React.useMemo(() => {
      if (!minDate) return false;
      const prevMonth = subMonths(currentMonth, 1);
      const lastDayOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
      const lastDayTime = new Date(lastDayOfPrevMonth.getFullYear(), lastDayOfPrevMonth.getMonth(), lastDayOfPrevMonth.getDate()).getTime();
      const minDateTime = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime();
      return lastDayTime < minDateTime;
    }, [currentMonth, minDate]);

    const handlePrev = () => {
      if (isPrevDisabled) return;
      setCurrentMonth((prev) => subMonths(prev, 1));
    };

    const handleNext = () => {
      setCurrentMonth((prev) => addMonths(prev, 1));
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[340px] rounded-3xl p-5 shadow-2xl overflow-hidden",
          "bg-zinc-950/95 backdrop-blur-xl border border-white/10",
          "text-white font-sans transition-all",
          className
        )}
        {...props}
      >
        <ScrollbarHide />

        {/* Date Display and Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <motion.p
            key={format(currentMonth, "MMMM yyyy")}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xl font-bold tracking-tight text-white"
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
              disabled={isPrevDisabled}
              className="p-1.5 rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Body (Monthly Grid) */}
        <motion.div
          key={format(currentMonth, "yyyy-MM")}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
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
              const disabled = isDateDisabled(day.date);

              return (
                <button
                  key={format(day.date, "yyyy-MM-dd")}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDateClick(day.date)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 relative",
                    {
                      "bg-gradient-to-br from-pink-500 to-orange-400 text-white shadow-lg shadow-orange-500/20 scale-105":
                        day.isSelected,
                      "hover:bg-white/20 text-white":
                        !day.isSelected && !disabled,
                      "opacity-30 cursor-not-allowed text-white/40":
                        disabled,
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
      </div>
    );
  }
);

GlassCalendar.displayName = "GlassCalendar";
export default GlassCalendar;
