// Multi-step wizard UI wrapping the input form
import React from 'react';
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, Check, ArrowRight, Star, Eye, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { theLabSteps } from "@/constants/the-lab";
import type { TheLabFormValues } from "@/types/the-lab";
import { useAuth } from "@/contexts/auth-context";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";

const LabelClass = "text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1.5 block";

export function parseCalendarDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  if (typeof d === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const parsed = new Date(`${d}T00:00:00`);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function calculateCalendarDays(start: Date | string | null | undefined, end: Date | string | null | undefined): number {
  const s = parseCalendarDate(start);
  const e = parseCalendarDate(end);
  if (!s || !e || e < s) return 0;
  const utcStart = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const utcEnd = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
  return Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
}

interface TheLabFormProps {
  form: UseFormReturn<TheLabFormValues>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onNext: () => void;
  onSubmit: (values: TheLabFormValues) => void;
  isGenerating: boolean;
  sidebarMode?: boolean;
  isActive?: boolean;
}

const StepDestinations = React.memo(({ form }: { form: UseFormReturn<TheLabFormValues> }) => (
  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
    <FormField control={form.control} name="startingLocation" render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className={LabelClass}>Starting Location</FormLabel>
        <FormControl>
          <Input placeholder="e.g., New Delhi, India" autoFocus {...field} value={field.value || ''} className="h-10 sm:h-11 text-sm border-white/10 focus:border-primary/50 bg-white/5 backdrop-blur rounded-xl" />
        </FormControl>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
    <FormField control={form.control} name="destinations" render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className={LabelClass}>Destinations to Visit</FormLabel>
        <FormControl>
          <Input placeholder="e.g., Paris, Rome, Florence" {...field} value={field.value || ''} className="h-10 sm:h-11 text-sm border-white/10 focus:border-primary/50 bg-white/5 backdrop-blur rounded-xl" />
        </FormControl>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
    <FormField control={form.control} name="endingLocation" render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className={LabelClass}>Ending Location (Optional)</FormLabel>
        <FormControl>
          <Input placeholder="Return location" {...field} value={field.value || ''} className="h-10 sm:h-11 text-sm border-white/10 focus:border-primary/50 bg-white/5 backdrop-blur rounded-xl" />
        </FormControl>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
  </div>
));
StepDestinations.displayName = 'StepDestinations';

const StepDaywisePlan = React.memo(({ form }: { form: UseFormReturn<TheLabFormValues> }) => {
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const daywiseDestinations = form.watch("daywiseDestinations") || "";

  const dayCount = React.useMemo(() => {
    return calculateCalendarDays(startDate, endDate);
  }, [startDate, endDate]);

  const parsedStartDate = React.useMemo(() => parseCalendarDate(startDate), [startDate]);

  const [localDays, setLocalDays] = React.useState<string[]>([]);
  const lastCombinedRef = React.useRef<string>("");

  // Sync inputs from standard format Day X: Content
  React.useEffect(() => {
    if (dayCount > 0) {
      if (daywiseDestinations === lastCombinedRef.current) {
        return;
      }
      const parsed = Array(dayCount).fill("");
      const chunks = daywiseDestinations.split(/(?=(?:^|\n)\s*Day\s*\d+\s*[:\-])/i);
      chunks.forEach((chunk) => {
        const match = chunk.match(/^\s*Day\s*(\d+)\s*[:\-]\s*([\s\S]*)$/i);
        if (match) {
          const dayNum = parseInt(match[1], 10);
          if (dayNum >= 1 && dayNum <= dayCount) {
            parsed[dayNum - 1] = match[2].trim().slice(0, 300);
          }
        }
      });
      setLocalDays(parsed);
      lastCombinedRef.current = daywiseDestinations;
    }
  }, [dayCount, daywiseDestinations]);

  const handleDayChange = (index: number, val: string) => {
    const truncated = val.slice(0, 300);
    const updated = [...localDays];
    updated[index] = truncated;
    setLocalDays(updated);

    const combined = updated
      .map((content, idx) => `Day ${idx + 1}: ${content.trim()}`)
      .filter((_, idx) => updated[idx].trim().length > 0)
      .join("\n");
    
    lastCombinedRef.current = combined;
    form.setValue("daywiseDestinations", combined, { shouldDirty: true, shouldValidate: true });
  };

  if (dayCount === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 animate-in fade-in duration-500">
        <p className="text-sm font-medium">Please select a valid Start and End Date first to generate your day-wise form template.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div>
          <span className={LabelClass}>Day-by-Day Focus</span>
          <p className="text-[10px] text-zinc-500 mt-0.5">Specify focus or activities (up to 300 characters per day). AI will construct detailed schedules around these.</p>
        </div>
        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">{dayCount} Days</span>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {Array.from({ length: dayCount }).map((_, index) => {
          const dayDate = parsedStartDate ? addDays(parsedStartDate, index) : new Date();
          const formattedDate = format(dayDate, "eee, MMM dd");
          const currentLength = (localDays[index] || "").length;

          return (
            <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-primary/30 transition-all duration-200">
              <div className="min-w-[80px] shrink-0 sm:pt-1">
                <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 block">DAY {index + 1}</span>
                <span className="text-[9px] text-zinc-500 font-medium block mt-0.5">{formattedDate}</span>
              </div>
              <div className="flex-1 w-full min-w-0 relative">
                <Textarea
                  placeholder={`e.g., Morning arrival, heritage walk through Old Delhi, visit Red Fort & Chandni Chowk, evening sound & light show...`}
                  value={localDays[index] || ""}
                  maxLength={300}
                  rows={2}
                  onChange={(e) => handleDayChange(index, e.target.value)}
                  className="min-h-[64px] text-xs border-white/5 focus:border-primary/50 bg-white/5 backdrop-blur rounded-lg w-full resize-none pb-5 text-slate-900 dark:text-zinc-100 placeholder:text-zinc-500"
                />
                <div className="absolute bottom-1.5 right-2 flex items-center pointer-events-none select-none">
                  <span className={cn(
                    "text-[10px] font-mono tabular-nums",
                    currentLength >= 300
                      ? "text-red-400 font-bold"
                      : currentLength >= 260
                        ? "text-amber-400 font-medium"
                        : "text-zinc-500"
                  )}>
                    {currentLength}/300
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
StepDaywisePlan.displayName = 'StepDaywisePlan';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(s);
          }}
          className="p-0.5 transition-colors"
        >
          <Star
            className={cn(
              "w-3 h-3 transition-colors",
              s <= value ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}

const StepStayOptions = React.memo(({ form, isActive = true }: { form: UseFormReturn<TheLabFormValues>; isActive?: boolean }) => {
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "hotels",
  });

  const replaceRef = React.useRef(replace);
  replaceRef.current = replace;

  const dayCount = React.useMemo(() => {
    return calculateCalendarDays(startDate, endDate);
  }, [startDate, endDate]);

  const staySlotsCount = Math.max(0, dayCount - 1);

  React.useEffect(() => {
    if (!isActive) return;

    if (staySlotsCount <= 0) {
      if (fields.length > 0) {
        replaceRef.current([]);
      }
      return;
    }

    const currentHotels = (form.getValues("hotels") || []).filter(
      (h: any) => h && typeof h === "object"
    );

    // Reconcile when fields length doesn't match staySlotsCount OR form raw hotels length doesn't match staySlotsCount
    if (fields.length !== staySlotsCount || currentHotels.length !== staySlotsCount) {
      const reconciled = Array.from({ length: staySlotsCount }, (_, i) => {
        const existing = currentHotels[i];
        if (existing && existing.id) {
          return {
            id: existing.id,
            dayIndex: i,
            name: existing.name || "",
            address: existing.address || "",
            starRating: existing.starRating || 3,
            nights: 1,
            checkIn: existing.checkIn || "2:00 PM",
            checkOut: existing.checkOut || "11:00 AM",
            bookingRef: existing.bookingRef || "",
          };
        }
        return {
          id: `h-wiz-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          dayIndex: i,
          name: "",
          address: "",
          starRating: 3,
          nights: 1,
          checkIn: "2:00 PM",
          checkOut: "11:00 AM",
          bookingRef: "",
        };
      });

      replaceRef.current(reconciled);
    }
  }, [staySlotsCount, fields.length, isActive, form]);

  const parsedStartDate = React.useMemo(() => parseCalendarDate(startDate), [startDate]);

  if (dayCount <= 1) {
    return (
      <div className="text-center py-8 text-zinc-500 animate-in fade-in duration-500">
        <p className="text-sm font-medium">Please select a valid Start and End Date (at least 2 days) first to configure stay options.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div>
          <span className={LabelClass}>Stay & Accommodation Options</span>
          <p className="text-[10px] text-zinc-500 mt-0.5">Specify stay options for each night. These sync with the Logistics tab.</p>
        </div>
        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">{staySlotsCount} Nights</span>
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {fields.map((field, index) => {
          const dayDate = parsedStartDate ? addDays(parsedStartDate, index) : new Date();
          const formattedDate = format(dayDate, "eee, MMM dd");
          const hotelRating = form.watch(`hotels.${index}.starRating`) || 3;

          return (
            <div key={field.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-primary/30 transition-all duration-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400">NIGHT {index + 1} ({formattedDate})</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-zinc-500 mr-1">Rating:</span>
                  <StarRating 
                    value={hotelRating} 
                    onChange={(v) => form.setValue(`hotels.${index}.starRating`, v, { shouldDirty: true, shouldValidate: true })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Hotel / Stay Name</label>
                  <Input
                    placeholder="e.g., Marriott, Cozy Homestay"
                    {...form.register(`hotels.${index}.name` as const)}
                    className="h-8.5 text-xs border-white/5 bg-white/5 backdrop-blur rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">City / Place</label>
                  <Input
                    placeholder="e.g., Delhi, Paris"
                    {...form.register(`hotels.${index}.address` as const)}
                    className="h-8.5 text-xs border-white/5 bg-white/5 backdrop-blur rounded-lg"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
StepStayOptions.displayName = 'StepStayOptions';

import { GlassCalendar } from "@/components/ui/glass-calendar";

const StepDates = React.memo(({ form, sidebarMode }: { form: UseFormReturn<TheLabFormValues>, sidebarMode?: boolean }) => {
  const [startOpen, setStartOpen] = React.useState(false);
  const [endOpen, setEndOpen] = React.useState(false);

  const startDate = form.watch("startDate");

  const handleStartDateSelect = (date: Date) => {
    form.setValue("startDate", date, { shouldValidate: true, shouldDirty: true });
    setStartOpen(false);

    // Automatically set end date to the next date/month if not set or if current endDate <= new startDate
    const currentEndDate = form.getValues("endDate");
    if (!currentEndDate || new Date(currentEndDate).getTime() <= new Date(date).getTime()) {
      const nextDay = addDays(date, 1);
      form.setValue("endDate", nextDay, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleEndDateSelect = (date: Date) => {
    form.setValue("endDate", date, { shouldValidate: true, shouldDirty: true });
    setEndOpen(false);
  };

  const effectiveMinEndDate = React.useMemo(() => {
    if (startDate) {
      return addDays(new Date(startDate), 1);
    }
    return addDays(new Date(), 1);
  }, [startDate]);

  return (
    <div className={cn("grid gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700", sidebarMode ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
      <FormField control={form.control} name="startDate" render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className={LabelClass}>Start Date</FormLabel>
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal px-3 py-2 h-10 sm:h-11 text-sm border-white/10 bg-white/5 backdrop-blur rounded-xl", !field.value && "text-muted-foreground/50")}>
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/40" />
                  {field.value ? <span className="font-medium">{format(new Date(field.value), "MMM dd, yyyy")}</span> : <span>Select date</span>}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-2xl rounded-3xl" align="start">
              <GlassCalendar
                selectedDate={field.value ? new Date(field.value) : undefined}
                onDateSelect={handleStartDateSelect}
                minDate={new Date()}
              />
            </PopoverContent>
          </Popover>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
      <FormField control={form.control} name="endDate" render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className={LabelClass}>End Date</FormLabel>
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal px-3 py-2 h-10 sm:h-11 text-sm border-white/10 bg-white/5 backdrop-blur rounded-xl", !field.value && "text-muted-foreground/50")}>
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/40" />
                  {field.value ? <span className="font-medium">{format(new Date(field.value), "MMM dd, yyyy")}</span> : <span>Select date</span>}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-2xl rounded-3xl" align="start">
              <GlassCalendar
                selectedDate={field.value ? new Date(field.value) : undefined}
                onDateSelect={handleEndDateSelect}
                minDate={effectiveMinEndDate}
              />
            </PopoverContent>
          </Popover>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )} />
    </div>
  );
});
StepDates.displayName = 'StepDates';

const StepPreferences = React.memo(({ form, sidebarMode }: { form: UseFormReturn<TheLabFormValues>, sidebarMode?: boolean }) => {
  const { agencySettings } = useAuth();
  const currencySymbol = getCurrencySymbol((agencySettings as any)?.default_currency || DEFAULT_CURRENCY);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <FormField control={form.control} name="tripType" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className={LabelClass}>Trip Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-11 text-sm border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur rounded-xl text-slate-900 dark:text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                <SelectItem value="adventurous">Adventurous</SelectItem>
                <SelectItem value="scenic">Scenic</SelectItem>
                <SelectItem value="relaxed">Relaxed</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="romantic">Romantic</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="foodie">Foodie</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={form.control} name="mealPlan" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className={LabelClass}>Meal Plan</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || "CP"} defaultValue={field.value || "CP"}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-11 text-sm border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur rounded-xl text-slate-900 dark:text-white">
                  <SelectValue placeholder="Select Meal Plan" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                <SelectItem value="CP">Breakfast Included (CP)</SelectItem>
                <SelectItem value="MAP">Breakfast & Dinner (MAP)</SelectItem>
                <SelectItem value="AP">All Meals Included (AP)</SelectItem>
                <SelectItem value="EP">Room Only / No Meals (EP)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={form.control} name="travelTimePreference" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className={LabelClass}>Timing Preference</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-11 text-sm border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur rounded-xl text-slate-900 dark:text-white">
                  <SelectValue placeholder="Preference" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                <SelectItem value="no_preference">No preference</SelectItem>
                <SelectItem value="avoid_night_travel">Avoid night</SelectItem>
                <SelectItem value="prefer_morning_travel">Morning</SelectItem>
                <SelectItem value="prefer_afternoon_travel">Afternoon</SelectItem>
                <SelectItem value="prefer_night_travel">Night</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
      </div>

      <div className="space-y-1">
        <FormLabel className={LabelClass}>Travel Options</FormLabel>
        <FormField control={form.control} name="travelMethods" render={({ field }) => {
          const methods = ["Flight", "Train", "Bus", "Cab", "Ferry"];
          return (
            <div className="flex flex-wrap gap-2">
              {methods.map((method) => {
                const isSelected = field.value?.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      const current = field.value || [];
                      const next = isSelected
                        ? current.filter((m) => m !== method)
                        : [...current, method];
                      field.onChange(next);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200",
                      isSelected 
                        ? "bg-primary/20 border-primary/50 text-primary" 
                        : "bg-white/5 border-white/10 text-slate-600 dark:text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          );
        }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <FormField control={form.control} name="mustInclude" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className={LabelClass}>Must-Include</FormLabel>
            <FormControl>
              <Textarea placeholder="e.g., Eiffel Tower" {...field} value={field.value || ''} className="min-h-[80px] border-white/10 bg-white/5 backdrop-blur rounded-xl p-3 resize-none text-xs" />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={form.control} name="avoid" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className={LabelClass}>Things to Avoid</FormLabel>
            <FormControl>
              <Textarea placeholder="e.g., Long queues" {...field} value={field.value || ''} className="min-h-[80px] border-white/10 bg-white/5 backdrop-blur rounded-xl p-3 resize-none text-xs" />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <FormField control={form.control} name="leisureTime" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur px-3 py-2">
            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 m-0">Leisure Time</FormLabel>
            <FormControl><Switch className="scale-75 origin-right" checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        <FormField control={form.control} name="leisureDay" render={({ field }) => (
          <FormItem className={cn("space-y-1 transition-opacity duration-300", !form.watch("leisureTime") && "opacity-30 pointer-events-none")}>
            <FormControl>
              <Input type="number" placeholder="Day Preference" {...field} value={field.value || ''} className="h-9 text-[11px] border-white/10 bg-white/5 backdrop-blur rounded-xl" />
            </FormControl>
          </FormItem>
        )} />
      </div>
    </div>
  );
});
StepPreferences.displayName = 'StepPreferences';
const WizardInputSummary = ({ form, currentStep }: { form: UseFormReturn<TheLabFormValues>; currentStep: number }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const values = form.getValues();

  // If we are on the first step, nothing to review yet.
  if (currentStep === 0) return null;

  const summaryItems = [];

  if (currentStep > 0 && values.startingLocation) {
    summaryItems.push({
      label: "Locations",
      value: `${values.startingLocation}${values.endingLocation ? ` → ${values.endingLocation}` : ""} (${values.destinations || "TBD"})`
    });
  }

  if (currentStep > 1 && values.startDate && values.endDate) {
    summaryItems.push({
      label: "Dates",
      value: `${format(new Date(values.startDate), "MMM dd")} - ${format(new Date(values.endDate), "MMM dd, yyyy")}`
    });
  }

  if (currentStep > 2 && values.daywiseDestinations) {
    summaryItems.push({
      label: "Custom Plan",
      value: values.daywiseDestinations
    });
  }

  if (currentStep > 3) {
    const prefList = [];
    if (values.tripType) prefList.push(`Style: ${values.tripType}`);
    if (values.mealPlan) {
      const mealLabels: Record<string, string> = {
        CP: "Breakfast Included (CP)",
        MAP: "Breakfast & Dinner (MAP)",
        AP: "All Meals Included (AP)",
        EP: "Room Only (EP)",
      };
      prefList.push(`Meals: ${mealLabels[values.mealPlan] || values.mealPlan}`);
    }
    if (values.travelTimePreference && values.travelTimePreference !== "no_preference") prefList.push(`Timing: ${values.travelTimePreference.replace(/_/g, ' ')}`);
    if (values.mustInclude) prefList.push(`Must Include: ${values.mustInclude}`);
    if (values.avoid) prefList.push(`Avoid: ${values.avoid}`);
    
    if (prefList.length > 0) {
      summaryItems.push({
        label: "Preferences",
        value: prefList.join(" | ")
      });
    }
  }

  if (summaryItems.length === 0) return null;

  return (
    <div className="border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
          Review Form Progress
        </span>
        <ChevronDown 
          className="w-3.5 h-3.5 transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      
      {isOpen && (
        <div className="px-4 pb-3 pt-1 border-t border-white/5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-start text-[11px] gap-1 sm:gap-4 py-1 border-b border-white/[0.02] last:border-0">
              <span className="font-bold text-zinc-500 uppercase tracking-widest sm:w-24 shrink-0">{item.label}</span>
              <span className="text-zinc-300 break-words line-clamp-2" title={item.value}>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const TheLabForm = React.memo(function TheLabForm({
  form, currentStep, setCurrentStep, onNext, onSubmit, isGenerating, sidebarMode, isActive = true
}: TheLabFormProps) {
  const { toast } = useToast();
  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (currentStep < theLabSteps.length - 1) {
            onNext();
          }
          // Last step: handled by the button's onClick directly
        }}
        className="space-y-8"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // Prevent default Enter key behavior and call onNext if not on last step
            if (currentStep < theLabSteps.length - 1) {
              const target = e.target as HTMLElement;
              // Don't interfere with textareas or buttons that might have their own behavior
              if (target.tagName !== "TEXTAREA" && target.getAttribute("role") !== "button" && target.tagName !== "BUTTON") {
                e.preventDefault();
                onNext();
              }
            }
          }
        }}
      >
        {!sidebarMode && (
          <>
            {/* Progress Bar & Indicators */}
            <div className="mb-4 flex items-center justify-center gap-2 sm:gap-3">
              {theLabSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (index <= currentStep || Boolean(form.getValues("destinations"))) {
                        setCurrentStep(index);
                      }
                    }}
                    disabled={index > currentStep && !Boolean(form.getValues("destinations"))}
                    className={cn(
                      "group relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-700 ease-out cursor-pointer disabled:cursor-not-allowed",
                      index < currentStep && "bg-foreground/10 text-foreground/60",
                      index === currentStep && "bg-foreground text-background shadow-lg",
                      index > currentStep && "bg-muted/50 text-muted-foreground/40",
                    )}
                  >
                    {index < currentStep ? <Check className="h-3 w-3 animate-in zoom-in duration-500" strokeWidth={2.5} /> : <span className="text-[10px] font-bold tabular-nums">{step.id}</span>}
                  </button>
                  {index < theLabSteps.length - 1 && (
                    <div className="relative h-[1px] w-4 sm:w-8 md:w-10">
                      <div className="absolute inset-0 bg-white/10" />
                      <div className="absolute inset-0 bg-foreground/30 transition-all duration-700 ease-out origin-left" style={{ transform: `scaleX(${index < currentStep ? 1 : 0})` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mb-4 overflow-hidden rounded-full bg-white/5 h-[1px]">
              <div className="h-full bg-foreground/60 transition-all duration-1000 ease-out" style={{ width: `${((currentStep + 1) / theLabSteps.length) * 100}%` }} />
            </div>
          </>
        )}

        <WizardInputSummary form={form} currentStep={currentStep} />

        {currentStep === 0 && <StepDestinations form={form} />}
        {currentStep === 1 && <StepDates form={form} sidebarMode={sidebarMode} />}
        {currentStep === 2 && <StepDaywisePlan form={form} />}
        {currentStep === 3 && <StepPreferences form={form} sidebarMode={sidebarMode} />}
        {currentStep === 4 && isActive && <StepStayOptions form={form} isActive={isActive} />}


        {/* Actions */}
        <div className="space-y-3 pt-2">
          {currentStep < theLabSteps.length - 1 ? (
            <Button key="btn-continue" type="button" onClick={(e) => { e.preventDefault(); onNext(); }} className="w-full h-10 group transition-all duration-300 hover:shadow-lg bg-primary text-white rounded-xl">
              <span className="flex items-center justify-center gap-2 text-sm font-bold">Continue <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 duration-300" strokeWidth={2} /></span>
            </Button>
          ) : (
            <Button
              key="btn-generate"
              type="button"
              disabled={isGenerating}
              onClick={async (e) => {
                e.preventDefault();
                // Clean stale hotel entries from RHF's internal registry.
                // RHF's shouldUnregister:false default keeps registrations from
                // previously-rendered hotel inputs alive, causing getValues() to
                // reconstruct partial objects (with only name/address) at old indices.
                // Filter to only keep entries that have both id and dayIndex, capped at staySlotsCount.
                const rawHotels = form.getValues("hotels") || [];
                const cleanHotels = rawHotels.filter(
                  (h: any) => h && typeof h.id === 'string' && h.id.length > 0 && typeof h.dayIndex === 'number'
                );
                const dayCount = calculateCalendarDays(form.getValues("startDate"), form.getValues("endDate"));
                const maxStaySlots = Math.max(0, dayCount - 1);
                const finalHotels = maxStaySlots > 0 ? cleanHotels.slice(0, maxStaySlots) : cleanHotels;
                if (finalHotels.length !== rawHotels.length) {
                  form.setValue("hotels", finalHotels, { shouldValidate: false });
                }
                // Validate ALL fields explicitly before submitting
                const isValid = await form.trigger();
                if (isValid) {
                  onSubmit(form.getValues());
                } else {
                  console.error("[TheLabForm] Validation failed. Errors:", JSON.stringify(form.formState.errors, null, 2));
                  const errors = form.formState.errors;
                  const errorKeys = Object.keys(errors);
                  const firstErrorKey = errorKeys[0] as keyof TheLabFormValues;
                  const firstError = errors[firstErrorKey];
                  const errorMessage = (firstError as any)?.message || "Please complete all required fields before generating.";

                  toast({
                    variant: "destructive",
                    title: "Incomplete Trip Details",
                    description: errorMessage,
                  });

                  // Automatically navigate user to the step that has the invalid field
                  for (let sIdx = 0; sIdx < theLabSteps.length; sIdx++) {
                    const stepFields = theLabSteps[sIdx].fields as readonly string[];
                    if (stepFields.some(f => errorKeys.includes(f))) {
                      setCurrentStep(sIdx);
                      break;
                    }
                  }
                }
              }}
              className="w-full h-10 hover:shadow-lg bg-primary text-white rounded-xl"
            >
              <span className="flex items-center justify-center gap-2 text-sm font-bold">{isGenerating ? "Crafting Your Journey..." : "Generate Optimized Trip"} {!isGenerating && <Check className="h-4 w-4 ml-1" strokeWidth={2} />}</span>
            </Button>
          )}
          {currentStep > 0 && <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="w-full text-center text-[11px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400">Go back</button>}
        </div>
      </form>
    </Form>
  );
});

export default TheLabForm;


